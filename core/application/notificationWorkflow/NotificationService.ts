import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import type {
  DonationNotificationDTO,
  NotificationDTO
} from '../../../commons/dto/NotificationDTO';
import {
  NotificationType
} from '../../../commons/dto/NotificationDTO'
import NotificationOperationError from './NotificationOperationError'
import type {
  DonationNotificationAttributes,
  DonationRequestPayloadAttributes,
  NotificationAttributes,
  SnsRegistrationAttributes} from './Types'
import type { SNSModel } from '../models/sns/SNSModel'
import { generateUniqueID } from '../utils/idGenerator'
import type { QueueModel } from '../models/queue/QueueModel'
import type { DonorSearchDTO, EligibleDonorInfo } from '../../../commons/dto/DonationDTO';
import { AcceptDonationStatus } from '../../../commons/dto/DonationDTO'
import type { Logger } from '../models/logger/Logger';
import type NotificationRepository from '../models/policies/repositories/NotificationRepository';
import { getBloodRequestMessage } from '../bloodDonationWorkflow/BloodDonationMessages';
import type { UserService } from '../userWorkflow/UserService';

export class NotificationService {
  constructor(
    protected readonly notificationRepository: NotificationRepository,
    protected readonly logger: Logger
  ) { }

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
  ): Promise<void> {
    try {
      await this.notificationRepository.create({
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
  ): Promise<void> {
    try {
      const { userId, type, status, payload } = notificationAttributes
      if (
        payload !== undefined &&
        [NotificationType.BLOOD_REQ_POST, NotificationType.REQ_ACCEPTED].includes(type)
      ) {
        const existingItem = await this.notificationRepository.getBloodDonationNotification(
          userId,
          notificationAttributes.payload.requestPostId,
          type
        )

        if (existingItem === null) {
          await this.notificationRepository.create({
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
  ): Promise<(NotificationDTO | DonationNotificationDTO)[]> {
    return this.notificationRepository.queryBloodDonationNotifications(
      requestPostId,
      AcceptDonationStatus.IGNORED
    )
  }

  async getRejectedDonorsCount(requestPostId: string): Promise<number> {
    const rejectedDonors = await this.getIgnoredDonorList(
      requestPostId
    )
    return rejectedDonors.length
  }

  async updateBloodDonationNotifications(
    requestPostId: string,
    notificationPayload: Partial<DonationRequestPayloadAttributes>
  ): Promise<void> {
    try {
      const existingNotifications = await this.notificationRepository.queryBloodDonationNotifications(
        requestPostId
      )

      if (existingNotifications === null) {
        throw new NotificationOperationError(
          'Notifications does not exist.',
          GENERIC_CODES.NOT_FOUND
        )
      }

      for (const notification of existingNotifications) {
        const updatedNotification: Partial<(NotificationDTO | DonationNotificationDTO)> = {
          id: requestPostId,
          userId: notification.userId,
          type: notification.type,
          payload: { ...notification.payload, ...notificationPayload }
        }

        await this.notificationRepository.update(updatedNotification)
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
  ): Promise<void> {
    const updatedNotification: Partial<DonationNotificationDTO> = {
      id: requestPostId,
      userId: donorId,
      type,
      status
    }
    await this.notificationRepository.update(updatedNotification)
  }

  async getBloodDonationNotification(
    donorId: string,
    requestPostId: string,
    type: NotificationType,
  ): Promise<(NotificationDTO | DonationNotificationDTO) | null> {
    const existingItem = await this.notificationRepository.getBloodDonationNotification(
      donorId,
      requestPostId,
      type
    )
    return existingItem
  }

  async storeDevice(
    registrationAttributes: SnsRegistrationAttributes,
    userService: UserService,
    snsModel: SNSModel,
  ): Promise<string> {
    try {
      const { userId } = registrationAttributes

      const { snsEndpointArn } = await snsModel.createPlatformEndpoint(registrationAttributes)
      if (snsEndpointArn === '') {
        throw new Error('Device registration failed.')
      }

      const item = await userService.getUser(userId)
      if (item === null) {
        throw new Error('Item not found.')
      }
      await userService.updateUserNotificationEndPoint(userId, snsEndpointArn)
      return 'Device registration successful.'
    } catch (error: unknown) {
      const typedError = error as Error
      if (typedError.name === 'InvalidParameterException') {
        const arnMatch = typedError.message.match(/arn:aws:sns:[\w-]+:\d+:endpoint\/\S+/)
        const existingArn = arnMatch !== null ? arnMatch[0] : null

        if (existingArn !== null) {
          return await this.handleExistingSnsEndpoint(
            snsModel,
            userService,
            existingArn,
            registrationAttributes
          )
        }
      }
      throw new Error('Failed to store Endpoint ARN')
    }
  }

  private async handleExistingSnsEndpoint(
    snsModel: SNSModel,
    userService: UserService,
    existingArn: string,
    registrationAttributes: SnsRegistrationAttributes
  ): Promise<string> {
    const existingAttributes = await snsModel.getEndpointAttributes(existingArn)
    await userService.updateUserNotificationEndPoint(existingAttributes.CustomUserData, '')

    await snsModel.setEndpointAttributes(existingArn, registrationAttributes)
    await userService.updateUserNotificationEndPoint(registrationAttributes.userId, existingArn)
    return 'Device registration successful with existing endpoint.'
  }

  async sendNotification(
    notificationAttributes: NotificationAttributes | DonationNotificationAttributes,
    queueModel: QueueModel
  ): Promise<void> {
    await queueModel.queue(notificationAttributes, process.env.NOTIFICATION_QUEUE_URL as string)
  }

  async sendRequestNotification(
    donorSearchAttributes: DonorSearchDTO,
    eligibleDonors: Record<string, EligibleDonorInfo>,
    queueModel: QueueModel
  ): Promise<void> {
    for (const donorId in eligibleDonors) {
      const notificationAttributes: DonationNotificationAttributes = {
        userId: donorId,
        title: 'Blood Request',
        body: getBloodRequestMessage(
          donorSearchAttributes.urgencyLevel,
          donorSearchAttributes.requestedBloodGroup,
          donorSearchAttributes.shortDescription
        ),
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: donorSearchAttributes.seekerId,
          requestPostId: donorSearchAttributes.requestPostId,
          createdAt: donorSearchAttributes.createdAt,
          locationId: eligibleDonors[donorId].locationId,
          distance: eligibleDonors[donorId].distance,
          seekerName: donorSearchAttributes.seekerName,
          patientName: donorSearchAttributes.patientName,
          requestedBloodGroup: donorSearchAttributes.requestedBloodGroup,
          bloodQuantity: donorSearchAttributes.bloodQuantity,
          urgencyLevel: donorSearchAttributes.urgencyLevel,
          location: donorSearchAttributes.location,
          contactNumber: donorSearchAttributes.contactNumber,
          transportationInfo: donorSearchAttributes.transportationInfo,
          shortDescription: donorSearchAttributes.shortDescription,
          donationDateTime: donorSearchAttributes.donationDateTime
        }
      }
      await this.sendNotification(notificationAttributes, queueModel)
    }
  }
}
