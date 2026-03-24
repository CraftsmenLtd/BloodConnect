import type { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda'
import type {
  NotificationAttributes
} from '../../../application/notificationWorkflow/Types'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SNSOperations from '../commons/sns/SNSOperations'
import { LocalCacheMapManager } from '../../../application/utils/localCacheMapManager'
import { UserService } from '../../../application/userWorkflow/UserService'
import { MAX_LOCAL_CACHE_SIZE_COUNT } from '../../../../commons/libs/constants/NoMagicNumbers'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import NotificationOperationError from '../../../application/notificationWorkflow/NotificationOperationError'
import DonationNotificationDynamoDbOperations from '../commons/ddbOperations/DonationNotificationDynamoDbOperations'
import UserDynamoDbOperations from '../commons/ddbOperations/UserDynamoDbOperations'
import { Config } from 'commons/libs/config/config'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'

const userDeviceToSnsEndpointMap = new LocalCacheMapManager<string, string>(
  MAX_LOCAL_CACHE_SIZE_COUNT
)

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
  minMonthsBetweenDonations: number;
  platformArnApns: string;
  platformArnFcm: string;
}>().getConfig()

const notificationDynamoDbOperations = new DonationNotificationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

const NON_RETRYABLE_CODES = new Set([
  GENERIC_CODES.BAD_REQUEST,
  GENERIC_CODES.NOT_FOUND,
  GENERIC_CODES.UNAUTHORIZED
])

function isNonRetryable(error: unknown): boolean {
  if (error instanceof NotificationOperationError) {
    return NON_RETRYABLE_CODES.has(error.errorCode)
  }

  return false
}

async function sendPushNotification(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = []

  for (const record of event.Records) {
    const failed = await processSQSRecord(record)
    if (failed) {
      batchItemFailures.push({ itemIdentifier: record.messageId })
    }
  }

  return { batchItemFailures }
}

async function processSQSRecord(record: SQSRecord): Promise<boolean> {
  const body: NotificationAttributes
    = typeof record.body === 'string' && record.body.trim() !== '' ? JSON.parse(record.body) : {}

  const { userId } = body
  const serviceLogger = createServiceLogger(userId)
  const notificationService = new NotificationService(notificationDynamoDbOperations, serviceLogger)
  const userService = new UserService(userDynamoDbOperations, serviceLogger)

  try {
    await notificationService.sendPushNotification(
      body,
      userId,
      userService,
      userDeviceToSnsEndpointMap,
      new SNSOperations(config.awsRegion, config.platformArnApns, config.platformArnFcm)
    )

    return false
  } catch (error) {
    if (isNonRetryable(error)) {
      serviceLogger.error({ error, messageId: record.messageId }, 'non-retryable error, skipping message')

      return false
    }

    serviceLogger.error({ error, messageId: record.messageId }, 'retryable error, marking for retry')

    return true
  }
}

export default sendPushNotification
