import type { SQSEvent, SQSRecord } from 'aws-lambda'
import type {
  DonationNotificationAttributes,
  NotificationAttributes
} from 'application/notificationWorkflow/Types'
import { NotificationService } from 'application/notificationWorkflow/NotificationService'
import SNSOperations from '../commons/sns/SNSOperations'
import type {
  BloodDonationNotificationDTO,
  NotificationDTO
} from '../../../../commons/dto/NotificationDTO';
import {
  NotificationType
} from '../../../../commons/dto/NotificationDTO'
import type { AcceptDonationStatus, AcceptedDonationDTO } from '../../../../commons/dto/DonationDTO'
import type {
  NotificationFields
} from 'application/models/dbModels/NotificationModel';
import NotificationModel from '../../../application/models/dbModels/NotificationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import { LocalCacheMapManager } from 'application/utils/localCacheMapManager'
import { UserService } from 'application/userWorkflow/UserService'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import type { UserFields } from 'application/models/dbModels/UserModel';
import UserModel from 'application/models/dbModels/UserModel'
import { MAX_LOCAL_CACHE_SIZE_COUNT } from '../../../../commons/libs/constants/NoMagicNumbers'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'
import type {
  BloodDonationNotificationFields
} from 'application/models/dbModels/DonationNotificationModel';
import DonationNotificationModel from 'application/models/dbModels/DonationNotificationModel'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import NotificationOperationError from 'core/application/notificationWorkflow/NotificationOperationError'

const userDeviceToSnsEndpointMap = new LocalCacheMapManager<string, string>(
  MAX_LOCAL_CACHE_SIZE_COUNT
)

const notificationService = new NotificationService()
const userService = new UserService()

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
  try {
    body.type = body.type ?? NotificationType.COMMON

    const cachedUserSnsEndpointArn = userDeviceToSnsEndpointMap.get(userId)
    if (cachedUserSnsEndpointArn === undefined) {
      const userSnsEndpointArn = await userService.getDeviceSnsEndpointArn(
        userId,
        new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
      )
      userDeviceToSnsEndpointMap.set(userId, userSnsEndpointArn)
      const newNotificationCreated = await createNotification(body)
      if (newNotificationCreated) {
        await notificationService.publishNotification(
          body,
          userSnsEndpointArn,
          new SNSOperations()
        )
      }
    } else {
      const newNotificationCreated = await createNotification(body)
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

async function createNotification(body: NotificationAttributes): Promise<boolean> {
  if (body.type === NotificationType.BLOOD_REQ_POST) {
    const existingNotification = await notificationService.getBloodDonationNotification(
      body.userId,
      body.payload.requestPostId as string,
      NotificationType.BLOOD_REQ_POST,
      new NotificationDynamoDbOperations<
      BloodDonationNotificationDTO,
      BloodDonationNotificationFields,
      DonationNotificationModel
      >(new DonationNotificationModel())
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
      notificationData,
      new NotificationDynamoDbOperations<
      BloodDonationNotificationDTO,
      BloodDonationNotificationFields,
      DonationNotificationModel
      >(new DonationNotificationModel())
    )
  } else if (body.type === NotificationType.REQ_ACCEPTED) {
    const existingNotification = await notificationService.getBloodDonationNotification(
      body.userId,
      body.payload.requestPostId as string,
      NotificationType.REQ_ACCEPTED,
      new NotificationDynamoDbOperations<
      BloodDonationNotificationDTO,
      BloodDonationNotificationFields,
      DonationNotificationModel
      >(new DonationNotificationModel())
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
        acceptedDonors: body.payload.acceptedDonors as AcceptedDonationDTO[]
      },
      status: body.payload.status as AcceptDonationStatus,
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
  return true
}
