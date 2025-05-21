import type { SQSEvent, SQSRecord } from 'aws-lambda'
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

async function sendPushNotification(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    await processSQSRecord(record)
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
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
  } catch (error) {
    if (error instanceof NotificationOperationError) {
      serviceLogger.error(error.message)
    } else {
      serviceLogger.error(error)
    }
    throw error
  }
}

export default sendPushNotification
