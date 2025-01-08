import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  DeleteObjectCommand,
  NotFound
} from '@aws-sdk/client-s3'
import { createServiceLogger } from '../commons/serviceLogger/ServiceLogger'
import { Context } from 'aws-lambda'

const client = new S3Client({ region: process.env.AWS_REGION })
const maxGeoHashLength = Number(process.env.MAX_GEOHASH_LENGTH)
const bucketName = process.env.BUCKET_NAME
const maxEstimatedGeohashSizeInBytes = maxGeoHashLength + 1
const maxGeohashToStoreInFile = Number(process.env.MAX_GEOHASH_STORAGE)

const countGeohashesInFile = (fileSize: number): number => fileSize / maxEstimatedGeohashSizeInBytes
const deleteExpiredFile = async (fileName: string): Promise<void> => { await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileName })) }
const createNewFile = async (fileName: string, geohash: string): Promise<void> => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: geohash
    }))
}

const appendGeohasToFile = async (fileName: string, fileContent: string): Promise<void> => {
  const createMultipartUploadResponse = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: fileName
    })
  )

  const uploadId = createMultipartUploadResponse.UploadId

  const uploadPartResponse = await client.send(
    new UploadPartCommand({
      Bucket: bucketName,
      Key: fileName,
      PartNumber: 1,
      UploadId: uploadId,
      Body: fileContent
    })
  )

  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: [
          {
            ETag: uploadPartResponse.ETag,
            PartNumber: 1
          }
        ]
      }
    })
  )
}

async function insertDonationRecord(event:
  Array<{ geohash: string; city: string; requestedBloodGroup: string }>,
  context: Context): Promise<void> {
  const serviceLogger = createServiceLogger(context.awsRequestId)
  try {
    const geohash = event[0].geohash
    const city = event[0].city
    const requestedBloodGroup = event[0].requestedBloodGroup
    const signOfRequestedBloodGroup = requestedBloodGroup.slice(-1) as "+" | "-"
    const bloodGroupCharacter = requestedBloodGroup.slice(0, -1)
    const mapOfSigns = {
      "+": "positive",
      "-": "negetive"
    }

    const potentialFileName = `${city}-${bloodGroupCharacter}-${mapOfSigns[signOfRequestedBloodGroup]}.txt`
    const fileContent = `${geohash}\n`
    try {
      const existingFile = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: potentialFileName }))
      serviceLogger.debug('found existing file')
      const fileSize = existingFile.ContentLength
      const currentNumberOfGeohashes = countGeohashesInFile(fileSize)
      if (currentNumberOfGeohashes > maxGeohashToStoreInFile) {
        serviceLogger.debug('deleting expired size')
        await deleteExpiredFile(potentialFileName)
        serviceLogger.debug('creating new file')
        return await createNewFile(potentialFileName, fileContent)
      }
      serviceLogger.debug('appending to file')
      return await appendGeohasToFile(potentialFileName, fileContent)
    } catch (error) {
      if (error instanceof NotFound) {
        serviceLogger.debug('creating new file')
        return await createNewFile(potentialFileName, fileContent)
      }
      throw error
    }
  } catch (error) {
    serviceLogger.error(error)
    throw error
  }
}

export default insertDonationRecord
