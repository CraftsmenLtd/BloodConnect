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
import { Config } from 'commons/libs/config/config'
import { Logger } from 'core/application/models/logger/Logger'

const client = new S3Client({ region: process.env.AWS_REGION })

const countGeohashesInFile = (fileSize: number, maxEstimatedGeohashSizeInBytes: number): number => fileSize / maxEstimatedGeohashSizeInBytes
const deleteExpiredFile = async(bucketName: string, fileName: string): Promise<void> => { await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileName })) }
const createNewFile = async(bucketName: string, fileName: string, geohash: string): Promise<void> => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: geohash
    }))
}

const appendGeohashToFileLargerThan5MB = async(bucketName: string, fileName: string, fileContent: string, fileSize: number): Promise<void> => {
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

const appendGeohashToFileSmallerThan5MB = async(bucketName: string, fileName: string, fileContent: string): Promise<void> => {
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

type ExpectedConfig = {
  maxGeohashLength: number;
  bucketName: string;
  maxGeohashStorage: number;
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

export async function monitorDonationRequest(event: Event[], logger: Logger, config: ExpectedConfig): Promise<void> {
  const maxGeoHashLength = config.maxGeohashLength
  const bucketName = config.bucketName
  const maxEstimatedGeohashSizeInBytes = maxGeoHashLength + 1
  const maxGeohashToStoreInFile = config.maxGeohashStorage

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
        logger.debug('found existing file')
        const fileSize = existingFile.ContentLength as number
        const currentNumberOfGeohashes = countGeohashesInFile(fileSize, maxEstimatedGeohashSizeInBytes)
        if (currentNumberOfGeohashes > maxGeohashToStoreInFile) {
          logger.debug('deleting expired size')
          await deleteExpiredFile(bucketName, potentialFileName)
          logger.debug('creating new file')
          await createNewFile(bucketName, potentialFileName, fileContent)
          return
        }

        const isFileGreaterThan5MB = fileSize > 5 * 1024 * 1024
        if (isFileGreaterThan5MB) {
          logger.debug('appending to file larger than 5MB')
          await appendGeohashToFileLargerThan5MB(bucketName, potentialFileName, fileContent, fileSize)
          return
        }

        logger.debug('appending to file smaller than 5mb')
        await appendGeohashToFileSmallerThan5MB(bucketName, potentialFileName, fileContent)
      } catch (error) {
        if (error instanceof NotFound) {
          logger.debug('creating new file')
          await createNewFile(bucketName, potentialFileName, fileContent)
          return
        }
        throw error
      }
    }
  } catch (error) {
    logger.error(error)
    throw error
  }
}

const config = new Config<{
  maxGeohashLength: number;
  bucketName: string;
  maxGeohashStorage: number;
}>()

export default async function monitorDonationRequestLambda(event: Event[], context: Context): Promise<void> {
  const serviceLogger = createServiceLogger(context.awsRequestId)

  return monitorDonationRequest(event, serviceLogger, config.getConfig())
}
