import { SQSEvent, SQSRecord } from 'aws-lambda'
import {
  BloodDonationNotificationAttributes,
  NotificationAttributes
} from '../../../application/notificationWorkflow/Types'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SNSOperations from '../commons/sns/SNSOperations'
import {
  BloodDonationNotificationDTO,
  NotificationDTO,
  NotificationType
} from '../../../../commons/dto/NotificationDTO'
import NotificationModel, {
  NotificationFields
} from '../../../application/models/dbModels/NotificationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import { LocalCacheMapManager } from '../../../application/utils/localCacheMapManager'
import { UserService } from '../../../application/userWorkflow/UserService'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import UserModel, { UserFields } from '../../../application/models/dbModels/UserModel'
import { MAX_LOCAL_CACHE_SIZE_COUNT } from '../../../../commons/libs/constants/NoMagicNumbers'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'
import DonationNotificationModel, {
  BloodDonationNotificationFields
} from '../../../application/models/dbModels/DonationNotificationModel'

const userDeviceToSnsEndpointMap = new LocalCacheMapManager<string, string>(
  MAX_LOCAL_CACHE_SIZE_COUNT
)

const notificationService = new NotificationService()
const userService = new UserService()

async function sendPushNotification(event: SQSEvent): Promise<{ status: string }> {
  try {
    for (const record of event.Records) {
      await processSQSRecord(record)
    }
    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error('An unknown error occurred')
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
  const body: NotificationAttributes =
    typeof record.body === 'string' && record.body.trim() !== '' ? JSON.parse(record.body) : {}

  const { userId } = body
  if (body.type === undefined) {
    body.type = NotificationType.COMMON
  }

  const cachedUserSnsEndpointArn = userDeviceToSnsEndpointMap.get(userId)
  if (cachedUserSnsEndpointArn === undefined) {
    const userSnsEndpointArn = await userService.getDeviceSnsEndpointArn(
      userId,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
    )
    userDeviceToSnsEndpointMap.set(userId, userSnsEndpointArn)
    await createNotification(body)
    await notificationService.publishNotification(
      body,
      userSnsEndpointArn,
      new SNSOperations()
    )
  } else {
    await createNotification(body)
    await notificationService.publishNotification(
      body,
      cachedUserSnsEndpointArn,
      new SNSOperations()
    )
  }
}

export default sendPushNotification

async function createNotification(body: NotificationAttributes): Promise<void> {
  if ([NotificationType.BLOOD_REQ_POST, NotificationType.REQ_ACCEPTED].includes(body.type)) {
    const notificationData: BloodDonationNotificationAttributes = {
      type: body.type,
      payload: {
        seekerId: body.payload.seekerId as string,
        requestPostId: body.payload.requestPostId as string,
        createdAt: body.payload.createdAt as string,
        bloodQuantity: body.payload.bloodQuantity as string,
        requestedBloodGroup: body.payload.requestedBloodGroup as string,
        urgencyLevel: body.payload.urgencyLevel as string,
        contactNumber: body.payload.contactNumber as string,
        donationDateTime: body.payload.donationDateTime as string,
        seekerName: body.payload.seekerName as string,
        patientName: body.payload.patientName as string,
        location: body.payload.location as string,
        locationId: body.payload.locationId as string,
        shortDescription: body.payload.shortDescription as string,
        transportationInfo: body.payload.transportationInfo as string,
        distance: body.payload.distance as number
      },
      userId: body.userId,
      title: body.title,
      body: body.body
    }
    await notificationService.createBloodDonationNotification(
      notificationData,
      new NotificationDynamoDbOperations<
      BloodDonationNotificationDTO,
      BloodDonationNotificationFields,
      DonationNotificationModel
      >(new DonationNotificationModel())
    )
  } else {
    await notificationService.createNotification(
      body,
      new NotificationDynamoDbOperations<NotificationDTO, NotificationFields, NotificationModel>(
        new NotificationModel()
      )
    )
  }
}
