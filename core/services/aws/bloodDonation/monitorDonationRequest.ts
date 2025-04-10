import type {
  UploadPartCopyCommandOutput,
  UploadPartCommandOutput} from '@aws-sdk/client-s3';
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
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import type { Context } from 'aws-lambda'
import { Config } from 'commons/libs/config/config'


type ExpectedConfig = {
  dynamodbTableName: string;
  awsRegion: string;
  maxGeohashLength: number;
  maxGeohashPrefixLength: number;
  monitorDonationBucketName: string;
  maxGeohashStorage: number;
  monitorDonationBucketPrefix: string;
}
const config = new Config<ExpectedConfig>().getConfig()

const client = new S3Client({ region: config.awsRegion })
const maxGeoHashLength = config.maxGeohashLength
const maxGeoHashPrefixLength = config.maxGeohashPrefixLength
const bucketName = config.monitorDonationBucketName
const maxEstimatedGeohashSizeInBytes = maxGeoHashLength + 1
const maxGeohashToStoreInFile = config.maxGeohashStorage
const bucketPathPrefix = config.monitorDonationBucketPrefix

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
  requestedBloodGroup: string;
}

const formatEvent = (event: Event[]): Map<string, string> => event.reduce((
  previousValue, currentValue) => {
  const geohashPrefix = currentValue.geohash.substring(0, maxGeoHashPrefixLength)
  const potentialKey = `${geohashPrefix}-${currentValue.requestedBloodGroup}`

  previousValue.set(potentialKey,
    previousValue.has(potentialKey)
      ? `${previousValue.get(potentialKey)}\n${currentValue.geohash}`
      : currentValue.geohash)

  return previousValue
}, new Map())

async function monitorDonationRequest(event: Event[], context: Context): Promise<void> {
  const serviceLogger = createServiceLogger(context.awsRequestId)
  try {
    for (const [key, fileContent] of formatEvent(event)) {
      const potentialFileName = `${bucketPathPrefix}/${key}.txt`
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
