import { SQSEvent, SQSRecord } from 'aws-lambda'
import { NotificationAttributes } from '../../../application/notificationWorkflow/Types'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SNSOperations from '../commons/sns/SNSOperations'
import { NotificationDTO } from '../../../../commons/dto/NotificationDTO'
import NotificationModel, {
  NotificationFields
} from '../../../application/models/dbModels/NotificationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import { LocalCacheMapManager } from '../../../application/utils/localCacheMapManager'
import { UserService } from '../../../application/userWorkflow/UserService'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import UserModel, { UserFields } from '../../../application/models/dbModels/UserModel'
import { MAX_LOCAL_CACHE_SIZE_COUNT } from '../../../../commons/libs/constants/NoMagicNumbers'

const userDeviceToSnsEndpointMap = new LocalCacheMapManager<string, string>(MAX_LOCAL_CACHE_SIZE_COUNT)

const notificationService = new NotificationService()
const userService = new UserService()

async function sendPushNotification(
  event: SQSEvent
): Promise<{ status: string }> {
  try {
    for (const record of event.Records) {
      await processSQSRecord(record)
    }
    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('An unknown error occurred')
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
  const body: NotificationAttributes = typeof record.body === 'string' && record.body.trim() !== ''
    ? JSON.parse(record.body)
    : {}

  const { userId } = body
  if (body.type === undefined) {
    body.type = 'COMMON'
  }

  const cachedUserSnsEndpointArn = userDeviceToSnsEndpointMap.get(userId)
  if (cachedUserSnsEndpointArn === undefined) {
    const userSnsEndpointArn = await userService.getDeviceSnsEndpointArn(
      userId,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
    )
    userDeviceToSnsEndpointMap.set(userId, userSnsEndpointArn)
    await notificationService.publishNotification(
      body,
      userSnsEndpointArn,
      new DynamoDbTableOperations<NotificationDTO, NotificationFields, NotificationModel>(new NotificationModel()),
      new SNSOperations()
    )
  } else {
    await notificationService.publishNotification(
      body,
      cachedUserSnsEndpointArn,
      new DynamoDbTableOperations<NotificationDTO, NotificationFields, NotificationModel>(new NotificationModel()),
      new SNSOperations()
    )
  }
}

export default sendPushNotification
