import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  DeleteObjectCommand,
  NotFound,
  UploadPartCopyCommand,
  UploadPartCopyCommandOutput,
  UploadPartCommandOutput,
  GetObjectCommand
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

const appendGeohasToFileLargerThan5MB = async (fileName: string, fileContent: string, fileSize: number): Promise<void> => {
  const createMultipartUploadResponse = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: fileName
    })
  )

  const uploadId = createMultipartUploadResponse.UploadId
  const uploadExistingFilePromise = client.send(
    new UploadPartCopyCommand({
      Bucket: bucketName,
      Key: fileName,
      PartNumber: 1,
      UploadId: uploadId,
      CopySource: `${bucketName}/${fileName}`,
      CopySourceRange: `bytes=0-${fileSize - 1}`
    }))

  const uploadNewPartPromise = client.send(
    new UploadPartCommand({
      Bucket: bucketName,
      Key: fileName,
      PartNumber: 2,
      UploadId: uploadId,
      Body: `\n${fileContent}`
    })
  )

  const parts = await Promise.all([uploadExistingFilePromise, uploadNewPartPromise].map(async (promise, index) => {
    const response = await promise
    const isExistingPart = index + 1 === 1
    return {
      PartNumber: index + 1,
      ETag: isExistingPart
        ? (response as UploadPartCopyCommandOutput).CopyPartResult?.ETag
        : (response as UploadPartCommandOutput).ETag
    }
  }))

  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
      }
    })
  )
}


const appendGeohasToFileSmallerThan5MB = async (fileName: string, fileContent: string) => {
  const existingFileResponse = await client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName
    })
  )
  const existingFileContent = await existingFileResponse.Body?.transformToString()
  const updatedFileContent = `${existingFileContent}\n${fileContent}`
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: updatedFileContent
    })
  )
}


async function insertDonationRecord(event:
  Array<{ geohash: string; city: string; requestedBloodGroup: string }>,
  context: Context): Promise<void> {
  const serviceLogger = createServiceLogger(context.awsRequestId)
  try {
    const fileContent = event[0].geohash
    const city = event[0].city
    const requestedBloodGroup = event[0].requestedBloodGroup
    const signOfRequestedBloodGroup = requestedBloodGroup.slice(-1) as '+' | '-'
    const bloodGroupCharacter = requestedBloodGroup.slice(0, -1)
    const mapOfSigns = {
      '+': 'positive',
      '-': 'negetive'
    }

    const potentialFileName = `${city}-${bloodGroupCharacter}-${mapOfSigns[signOfRequestedBloodGroup]}.txt`
    try {
      const existingFile = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: potentialFileName }))
      serviceLogger.debug('found existing file')
      const fileSize = existingFile.ContentLength as number
      const currentNumberOfGeohashes = countGeohashesInFile(fileSize)
      if (currentNumberOfGeohashes > maxGeohashToStoreInFile) {
        serviceLogger.debug('deleting expired size')
        await deleteExpiredFile(potentialFileName)
        serviceLogger.debug('creating new file')
        await createNewFile(potentialFileName, fileContent)
        return
      }

      const isFileGreaterThan5MB = fileSize > 5 * 1024 * 1024
      if (isFileGreaterThan5MB) {
        serviceLogger.debug('appending to file larger than 5MB')
        await appendGeohasToFileLargerThan5MB(potentialFileName, fileContent, fileSize)
        return
      }
      serviceLogger.debug('appending to file smaller than 5mb')
      await appendGeohasToFileSmallerThan5MB(potentialFileName, fileContent)

    } catch (error) {
      if (error instanceof NotFound) {
        serviceLogger.debug('creating new file')
        await createNewFile(potentialFileName, fileContent)
        return
      }
      throw error
    }
  } catch (error) {
    serviceLogger.error(error)
    throw error
  }
}

export default insertDonationRecord
