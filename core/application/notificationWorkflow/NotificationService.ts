import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import { UserDetailsDTO } from '../../../commons/dto/UserDTO'
import {
  BloodDonationNotificationDTO,
  NotificationDTO,
  NotificationType
} from '../../../commons/dto/NotificationDTO'
import NotificationOperationError from './NotificationOperationError'
import {
  DonationNotificationAttributes,
  DonationRequestPayloadAttributes,
  NotificationAttributes,
  SnsRegistrationAttributes,
  StoreNotificationEndPoint
} from './Types'
import Repository from '../models/policies/repositories/Repository'
import { SNSModel } from '../models/sns/SNSModel'
import { generateUniqueID } from '../utils/idGenerator'
import { QueueModel } from '../models/queue/QueueModel'
import NotificationRepository from '../models/policies/repositories/NotificationRepository'
import { AcceptDonationStatus } from '../../../commons/dto/DonationDTO'

export class NotificationService {
  async publishNotification(
    notificationAttributes: NotificationAttributes,
    userSnsEndpointArn: string,
    snsModel: SNSModel
  ): Promise<void> {
    try {
      await snsModel.publish(notificationAttributes, userSnsEndpointArn)
    } catch (error) {
      throw new NotificationOperationError(
        `Failed to notify user. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async createNotification(
    notificationAttributes: NotificationAttributes,
    notificationRepository: NotificationRepository<NotificationDTO>
  ): Promise<void> {
    try {
      await notificationRepository.create({
        ...notificationAttributes,
        id: generateUniqueID(),
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      throw new NotificationOperationError(
        `Failed to create notification. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async createBloodDonationNotification(
    notificationAttributes: DonationNotificationAttributes,
    notificationRepository: NotificationRepository<BloodDonationNotificationDTO>
  ): Promise<void> {
    try {
      const { userId, type, status, payload } = notificationAttributes
      if (
        payload !== undefined &&
        [NotificationType.BLOOD_REQ_POST, NotificationType.REQ_ACCEPTED].includes(type)
      ) {
        const existingItem = await notificationRepository.getBloodDonationNotification(
          userId,
          notificationAttributes.payload.requestPostId,
          type
        )

        if (existingItem === null) {
          await notificationRepository.create({
            ...notificationAttributes,
            status: status ?? AcceptDonationStatus.PENDING,
            id: notificationAttributes.payload.requestPostId,
            createdAt: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      throw new NotificationOperationError(
        `Failed to create notification. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async getIgnoredDonorList(
    requestPostId: string,
    notificationRepository: NotificationRepository<BloodDonationNotificationDTO>
  ): Promise<BloodDonationNotificationDTO[]> {
    return await notificationRepository.queryBloodDonationNotifications(
      requestPostId,
      AcceptDonationStatus.IGNORED
    )
  }

  async updateBloodDonationNotifications(
    requestPostId: string,
    notificationPayload: Partial<DonationRequestPayloadAttributes>,
    notificationRepository: NotificationRepository<BloodDonationNotificationDTO>
  ): Promise<void> {
    try {
      const existingNotifications = await notificationRepository.queryBloodDonationNotifications(
        requestPostId
      )

      if (existingNotifications === null) {
        throw new NotificationOperationError(
          'Notifications does not exist.',
          GENERIC_CODES.NOT_FOUND
        )
      }

      for (const notification of existingNotifications) {
        const updatedNotification: Partial<BloodDonationNotificationDTO> = {
          id: requestPostId,
          userId: notification.userId,
          type: notification.type,
          payload: { ...notification.payload, ...notificationPayload }
        }

        await notificationRepository.update(updatedNotification)
      }
    } catch (error) {
      throw new NotificationOperationError(
        `Failed to update notification. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async updateBloodDonationNotificationStatus(
    donorId: string,
    requestPostId: string,
    type: NotificationType,
    status: AcceptDonationStatus,
    notificationRepository: NotificationRepository<BloodDonationNotificationDTO>
  ): Promise<void> {
    const updatedNotification: Partial<BloodDonationNotificationDTO> = {
      id: requestPostId,
      userId: donorId,
      type,
      status
    }
    await notificationRepository.update(updatedNotification)
  }

  async getBloodDonationNotification(
    donorId: string,
    requestPostId: string,
    type: NotificationType,
    notificationRepository: NotificationRepository<BloodDonationNotificationDTO>
  ): Promise<BloodDonationNotificationDTO | null> {
    const existingItem = await notificationRepository.getBloodDonationNotification(
      donorId,
      requestPostId,
      type
    )
    return existingItem
  }

  async storeDevice(
    registrationAttributes: SnsRegistrationAttributes,
    userRepository: Repository<UserDetailsDTO>,
    snsModel: SNSModel
  ): Promise<string> {
    try {
      const { userId } = registrationAttributes

      const { snsEndpointArn } = await snsModel.createPlatformEndpoint(registrationAttributes)
      if (snsEndpointArn === '') {
        throw new Error('Device registration failed.')
      }

      const item = await userRepository.getItem(`USER#${userId}`, 'PROFILE')
      if (item === null) {
        throw new Error('Item not found.')
      }

      const updateData: Partial<StoreNotificationEndPoint> = {
        id: userId,
        snsEndpointArn,
        updatedAt: new Date().toISOString()
      }
      await userRepository.update(updateData)
      return 'Device registration successful.'
    } catch (error: unknown) {
      const typedError = error as Error
      if (typedError.name === 'InvalidParameterException') {
        const arnMatch = typedError.message.match(/arn:aws:sns:[\w-]+:\d+:endpoint\/\S+/)
        const existingArn = arnMatch !== null ? arnMatch[0] : null

        if (existingArn !== null) {
          return await this.handleExistingSnsEndpoint(
            snsModel,
            existingArn,
            userRepository,
            registrationAttributes
          )
        }
      }
      throw new Error('Failed to store Endpoint ARN')
    }
  }

  private async handleExistingSnsEndpoint(
    snsModel: SNSModel,
    existingArn: string,
    userRepository: Repository<UserDetailsDTO>,
    registrationAttributes: SnsRegistrationAttributes
  ): Promise<string> {
    const existingAttributes = await snsModel.getEndpointAttributes(existingArn)
    const oldUpdateData: Partial<StoreNotificationEndPoint> = {
      id: existingAttributes.CustomUserData,
      snsEndpointArn: '',
      updatedAt: new Date().toISOString()
    }

    await userRepository.update(oldUpdateData)

    await snsModel.setEndpointAttributes(existingArn, registrationAttributes)
    const { userId } = registrationAttributes

    const updateData: Partial<StoreNotificationEndPoint> = {
      id: userId,
      snsEndpointArn: existingArn,
      updatedAt: new Date().toISOString()
    }
    await userRepository.update(updateData)
    return 'Device registration successful with existing endpoint.'
  }

  async sendNotification(
    notificationAttributes: NotificationAttributes | DonationNotificationAttributes,
    queueModel: QueueModel
  ): Promise<void> {
    await queueModel.queue(notificationAttributes, process.env.NOTIFICATION_QUEUE_URL as string)
  }
}
