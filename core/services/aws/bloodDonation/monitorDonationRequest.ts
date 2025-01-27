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
const deleteExpiredFile = async(fileName: string): Promise<void> => { await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileName })) }
const createNewFile = async(fileName: string, geohash: string): Promise<void> => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: geohash
    }))
}

const appendGeohashToFileLargerThan5MB = async(fileName: string, fileContent: string, fileSize: number): Promise<void> => {
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

  const parts = await Promise.all([uploadExistingFilePromise, uploadNewPartPromise].map(async(promise, index) => {
    const response = await promise
    const isExistingPart = index === 0
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

const appendGeohashToFileSmallerThan5MB = async(fileName: string, fileContent: string): Promise<void> => {
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

type Event = {
  geohash: string;
  city: string;
  requestedBloodGroup: string;
}

type GroupedByCityAndRequestedBloodGroup = {
  city: string;
  requestedBloodGroup: string;
  geohashes: string;
}

const formatEvent = (event: Event[]): GroupedByCityAndRequestedBloodGroup[] => event.reduce((
  previousValue: GroupedByCityAndRequestedBloodGroup[], currentValue) => {
  const existingGroup = previousValue.find(
    (value) => value.requestedBloodGroup === currentValue.requestedBloodGroup &&
    value.city === currentValue.city)

  if (existingGroup !== null && existingGroup !== undefined) {
    existingGroup.geohashes = `${existingGroup.geohashes}\n${currentValue.geohash}`
  } else {
    previousValue.push({
      city: currentValue.city,
      requestedBloodGroup: currentValue.requestedBloodGroup,
      geohashes: currentValue.geohash
    })
  }
  return previousValue
}, [])

async function monitorDonationRequest(event:
Event[],
context: Context): Promise<void> {
  const serviceLogger = createServiceLogger(context.awsRequestId)
  try {
    for (const formattedEvent of formatEvent(event)) {
      const fileContent = formattedEvent.geohashes
      const city = formattedEvent.city
      const requestedBloodGroup = formattedEvent.requestedBloodGroup
      const signOfRequestedBloodGroup = requestedBloodGroup.slice(-1) as '+' | '-'
      const bloodGroupCharacter = requestedBloodGroup.slice(0, -1)
      const mapOfSigns = {
        '+': 'positive',
        '-': 'negative'
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
          await appendGeohashToFileLargerThan5MB(potentialFileName, fileContent, fileSize)
          return
        }

        serviceLogger.debug('appending to file smaller than 5mb')
        await appendGeohashToFileSmallerThan5MB(potentialFileName, fileContent)
      } catch (error) {
        if (error instanceof NotFound) {
          serviceLogger.debug('creating new file')
          await createNewFile(potentialFileName, fileContent)
          return
        }
        throw error
      }
    }
  } catch (error) {
    serviceLogger.error(error)
    throw error
  }
}

export default monitorDonationRequest
