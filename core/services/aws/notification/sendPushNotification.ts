import type { SQSEvent, SQSRecord } from 'aws-lambda'
import type {
  DonationNotificationAttributes,
  NotificationAttributes
} from '../../../application/notificationWorkflow/Types'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SNSOperations from '../commons/sns/SNSOperations'
import {
  NotificationType
} from '../../../../commons/dto/NotificationDTO'
import { LocalCacheMapManager } from '../../../application/utils/localCacheMapManager'
import { UserService } from '../../../application/userWorkflow/UserService'
import type {
  AcceptDonationStatus,
  AcceptDonationDTO
} from '../../../../commons/dto/DonationDTO'
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
  const body: NotificationAttributes =
    typeof record.body === 'string' && record.body.trim() !== '' ? JSON.parse(record.body) : {}

  const { userId } = body
  const serviceLogger = createServiceLogger(userId)
  const notificationService = new NotificationService(notificationDynamoDbOperations, serviceLogger)
  const userService = new UserService(userDynamoDbOperations, serviceLogger)

  try {
    body.type = body.type ?? NotificationType.COMMON

    const cachedUserSnsEndpointArn = userDeviceToSnsEndpointMap.get(userId)
    if (cachedUserSnsEndpointArn === undefined) {
      const userSnsEndpointArn = await userService.getDeviceSnsEndpointArn(
        userId
      )
      userDeviceToSnsEndpointMap.set(userId, userSnsEndpointArn)
      const newNotificationCreated = await createNotification(notificationService, body)
      if (newNotificationCreated) {
        await notificationService.publishNotification(
          body,
          userSnsEndpointArn,
          new SNSOperations()
        )
      }
    } else {
      const newNotificationCreated = await createNotification(notificationService, body)
      if (newNotificationCreated) {
        await notificationService.publishNotification(
          body,
          cachedUserSnsEndpointArn,
          new SNSOperations()
        )
      }
    }
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

async function createNotification(
  notificationService: NotificationService,
  body: NotificationAttributes
): Promise<boolean> {
  if (body.type === NotificationType.BLOOD_REQ_POST) {
    const existingNotification = await notificationService.getBloodDonationNotification(
      body.userId,
      body.payload.requestPostId as string,
      NotificationType.BLOOD_REQ_POST
    )
    if (existingNotification !== null) {
      return false
    }
    const notificationData: DonationNotificationAttributes = {
      type: body.type,
      payload: {
        seekerId: body.payload.seekerId as string,
        requestPostId: body.payload.requestPostId as string,
        createdAt: body.payload.createdAt as string,
        bloodQuantity: body.payload.bloodQuantity as number,
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
      status: body.payload.status as AcceptDonationStatus,
      userId: body.userId,
      title: body.title,
      body: body.body
    }

    await notificationService.createBloodDonationNotification(
      notificationData
    )
  } else if (body.type === NotificationType.REQ_ACCEPTED) {
    const existingNotification = await notificationService.getBloodDonationNotification(
      body.userId,
      body.payload.requestPostId as string,
      NotificationType.REQ_ACCEPTED
    )
    if (existingNotification !== null) {
      return false
    }
    const notificationData: DonationNotificationAttributes = {
      type: body.type,
      payload: {
        seekerId: body.payload.seekerId as string,
        requestPostId: body.payload.requestPostId as string,
        createdAt: body.payload.createdAt as string,
        donorId: body.payload.donorId as string,
        donorName: body.payload.donorName as string,
        phoneNumbers: body.payload.phoneNumbers as string[],
        requestedBloodGroup: body.payload.requestedBloodGroup as string,
        bloodQuantity: body.payload.bloodQuantity as number,
        urgencyLevel: body.payload.urgencyLevel as string,
        donationDateTime: body.payload.donationDateTime as string,
        location: body.payload.location as string,
        shortDescription: body.payload.shortDescription as string,
        acceptedDonors: body.payload.acceptedDonors as AcceptDonationDTO[]
      },
      status: body.payload.status as AcceptDonationStatus,
      userId: body.userId,
      title: body.title,
      body: body.body
    }
    await notificationService.createBloodDonationNotification(
      notificationData
    )
  } else {
    await notificationService.createNotification(
      body
    )
  }
  return true
}
