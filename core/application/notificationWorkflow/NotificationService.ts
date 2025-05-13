import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import type { DonationNotificationDTO, NotificationDTO } from '../../../commons/dto/NotificationDTO'
import { NotificationType } from '../../../commons/dto/NotificationDTO'
import NotificationOperationError from './NotificationOperationError'
import type {
  DonationNotificationAttributes,
  DonationRequestPayloadAttributes,
  NotificationAttributes,
  SnsRegistrationAttributes
} from './Types'
import type { SNSModel } from '../models/sns/SNSModel'
import { generateUniqueID } from '../utils/idGenerator'
import type { QueueModel } from '../models/queue/QueueModel'
import type {
  AcceptDonationDTO,
  DonationDTO,
  EligibleDonorInfo
} from '../../../commons/dto/DonationDTO'
import { AcceptDonationStatus } from '../../../commons/dto/DonationDTO'
import type { Logger } from '../models/logger/Logger'
import type NotificationRepository from '../models/policies/repositories/NotificationRepository'
import { getBloodRequestMessage } from '../bloodDonationWorkflow/BloodDonationMessages'
import type { UserService } from '../userWorkflow/UserService'
import type { LocalCacheMapManager } from '../utils/localCacheMapManager'

export class NotificationService {
  constructor(
    protected readonly notificationRepository: NotificationRepository,
    protected readonly logger: Logger
  ) {}

  async sendPushNotification(
    notificationAttributes: NotificationAttributes,
    userId: string,
    userService: UserService,
    userDeviceToSnsEndpointMap: LocalCacheMapManager<string, string>,
    snsModel: SNSModel
  ): Promise<void> {
    notificationAttributes.type = notificationAttributes.type ?? NotificationType.COMMON
    const cachedUserSnsEndpointArn = await this.getUserSnsEndpointArn(
      userDeviceToSnsEndpointMap,
      userId,
      userService
    )
    this.logger.info('creating notification record')
    const newNotificationCreated = await this.createNotificationRecord(
      notificationAttributes
    )
    if (newNotificationCreated) {
      this.logger.info('publishing notification')
      await this.publishNotification(
        notificationAttributes,
        cachedUserSnsEndpointArn,
        snsModel
      )
    }
  }

  private async getUserSnsEndpointArn(
    userDeviceToSnsEndpointMap: LocalCacheMapManager<string, string>,
    userId: string,
    userService: UserService
  ): Promise<string> {
    const cachedUserSnsEndpointArn = userDeviceToSnsEndpointMap.get(userId)
    if (cachedUserSnsEndpointArn === undefined) {
      const userSnsEndpointArn = await userService.getDeviceSnsEndpointArn(userId)
      userDeviceToSnsEndpointMap.set(userId, userSnsEndpointArn)
      return userSnsEndpointArn
    } else {
      return cachedUserSnsEndpointArn
    }
  }

  async createNotificationRecord(
    notificationAttributes: NotificationAttributes
  ): Promise<boolean> {
    if (notificationAttributes.type === NotificationType.BLOOD_REQ_POST) {
      this.logger.info('checking if notification record exists')
      const existingNotification = await this.getBloodDonationNotification(
        notificationAttributes.userId,
        notificationAttributes.payload.requestPostId as string,
        NotificationType.BLOOD_REQ_POST
      )
      if (existingNotification !== null) {
        this.logger.info('notification record exists')
        return false
      }
      const notificationData: DonationNotificationAttributes = {
        type: notificationAttributes.type,
        payload: {
          seekerId: notificationAttributes.payload.seekerId as string,
          requestPostId: notificationAttributes.payload.requestPostId as string,
          createdAt: notificationAttributes.payload.createdAt as string,
          bloodQuantity: notificationAttributes.payload.bloodQuantity as number,
          requestedBloodGroup: notificationAttributes.payload.requestedBloodGroup as string,
          urgencyLevel: notificationAttributes.payload.urgencyLevel as string,
          contactNumber: notificationAttributes.payload.contactNumber as string,
          donationDateTime: notificationAttributes.payload.donationDateTime as string,
          seekerName: notificationAttributes.payload.seekerName as string,
          patientName: notificationAttributes.payload.patientName as string,
          location: notificationAttributes.payload.location as string,
          locationId: notificationAttributes.payload.locationId as string,
          shortDescription: notificationAttributes.payload.shortDescription as string,
          transportationInfo: notificationAttributes.payload.transportationInfo as string,
          distance: notificationAttributes.payload.distance as number
        },
        status: notificationAttributes.payload.status as AcceptDonationStatus,
        userId: notificationAttributes.userId,
        title: notificationAttributes.title,
        body: notificationAttributes.body
      }
      this.logger.info('creating donation notification record')
      await this.createBloodDonationNotification(notificationData)
    } else if (
      [NotificationType.REQ_ACCEPTED, NotificationType.REQ_IGNORED].includes(
        notificationAttributes.type
      )
    ) {
      const notificationData: DonationNotificationAttributes = {
        type: notificationAttributes.type,
        payload: {
          seekerId: notificationAttributes.payload.seekerId as string,
          requestPostId: notificationAttributes.payload.requestPostId as string,
          createdAt: notificationAttributes.payload.createdAt as string,
          donorId: notificationAttributes.payload.donorId as string,
          donorName: notificationAttributes.payload.donorName as string,
          phoneNumbers: notificationAttributes.payload.phoneNumbers as string[],
          requestedBloodGroup: notificationAttributes.payload.requestedBloodGroup as string,
          bloodQuantity: notificationAttributes.payload.bloodQuantity as number,
          urgencyLevel: notificationAttributes.payload.urgencyLevel as string,
          donationDateTime: notificationAttributes.payload.donationDateTime as string,
          location: notificationAttributes.payload.location as string,
          shortDescription: notificationAttributes.payload.shortDescription as string,
          acceptedDonors: notificationAttributes.payload.acceptedDonors as AcceptDonationDTO[]
        },
        status: notificationAttributes.payload.status as AcceptDonationStatus,
        userId: notificationAttributes.userId,
        title: notificationAttributes.title,
        body: notificationAttributes.body
      }
      this.logger.info('creating donation response notification record')
      await this.createBloodDonationNotification(notificationData)
    } else {
      this.logger.info('creating common notification record')
      await this.createNotification(notificationAttributes)
    }
    return true
  }

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

  async createNotification(notificationAttributes: NotificationAttributes): Promise<void> {
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
    notificationAttributes: DonationNotificationAttributes
  ): Promise<void> {
    try {
      const { userId, type, status, payload } = notificationAttributes
      if (payload !== undefined && [NotificationType.BLOOD_REQ_POST].includes(type)) {
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
      else {
        await this.notificationRepository.create({
          ...notificationAttributes,
          id: notificationAttributes.payload.requestPostId,
          createdAt: new Date().toISOString()
        })
      }
    } catch (error) {
      throw new NotificationOperationError(
        `Failed to create notification. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async getIgnoredDonorList(
    requestPostId: string
  ): Promise<(NotificationDTO | DonationNotificationDTO)[]> {
    return this.notificationRepository.queryBloodDonationNotifications(
      requestPostId,
      AcceptDonationStatus.IGNORED
    )
  }

  async getRejectedDonorsCount(requestPostId: string): Promise<number> {
    const rejectedDonors = await this.getIgnoredDonorList(requestPostId)
    return rejectedDonors.length
  }

  async updateBloodDonationNotifications(
    requestPostId: string,
    notificationPayload: Partial<DonationRequestPayloadAttributes>
  ): Promise<void> {
    try {
      const existingNotifications =
        await this.notificationRepository.queryBloodDonationNotifications(requestPostId)

      if (existingNotifications === null) {
        throw new NotificationOperationError(
          'Notifications does not exist.',
          GENERIC_CODES.NOT_FOUND
        )
      }

      for (const notification of existingNotifications) {
        const updatedNotification: Partial<NotificationDTO | DonationNotificationDTO> = {
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
    status: AcceptDonationStatus
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
    type: NotificationType
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
    snsModel: SNSModel
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
    queueModel: QueueModel,
    notificationQueueUrl: string
  ): Promise<void> {
    await queueModel.queue(notificationAttributes, notificationQueueUrl)
  }

  async sendRequestNotification(
    donationAttributes: DonationDTO,
    eligibleDonors: Record<string, EligibleDonorInfo>,
    queueModel: QueueModel,
    notificationQueueUrl: string
  ): Promise<void> {
    for (const donorId in eligibleDonors) {
      const notificationAttributes: DonationNotificationAttributes = {
        userId: donorId,
        title: 'Blood Request',
        body: getBloodRequestMessage(
          donationAttributes.urgencyLevel,
          donationAttributes.requestedBloodGroup,
          donationAttributes.shortDescription
        ),
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: donationAttributes.seekerId,
          requestPostId: donationAttributes.requestPostId,
          createdAt: donationAttributes.createdAt,
          locationId: eligibleDonors[donorId].locationId,
          distance: eligibleDonors[donorId].distance,
          seekerName: donationAttributes.seekerName,
          patientName: donationAttributes.patientName,
          requestedBloodGroup: donationAttributes.requestedBloodGroup,
          bloodQuantity: donationAttributes.bloodQuantity,
          urgencyLevel: donationAttributes.urgencyLevel,
          location: donationAttributes.location,
          contactNumber: donationAttributes.contactNumber,
          transportationInfo: donationAttributes.transportationInfo,
          shortDescription: donationAttributes.shortDescription,
          donationDateTime: donationAttributes.donationDateTime
        }
      }
      await this.sendNotification(notificationAttributes, queueModel, notificationQueueUrl)
    }
  }
}
