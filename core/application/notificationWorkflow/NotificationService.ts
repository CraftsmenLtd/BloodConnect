import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import { UserDetailsDTO } from '../../../commons/dto/UserDTO'
import { NotificationDTO } from '../../../commons/dto/NotificationDTO'
import NotificationOperationError from './NotificationOperationError'
import { BloodPostNotificationAttributes, NotificationAttributes, SnsRegistrationAttributes, StoreNotificationEndPoint } from './Types'
import Repository from '../models/policies/repositories/Repository'
import { SNSModel } from '../../application/models/sns/SNSModel'
import { generateUniqueID } from '../utils/idGenerator'
import { QueueModel } from '../models/queue/QueueModel'

export class NotificationService {
  async publishNotification(
    notificationAttributes: NotificationAttributes,
    userSnsEndpointArn: string,
    notificationRepository: Repository<NotificationDTO>,
    snsModel: SNSModel
  ): Promise<string> {
    try {
      const { userId, type, payload } = notificationAttributes

      if (payload !== undefined && ['BLOOD_REQ_POST', 'REQ_ACCEPTED'].includes(type)) {
        const requestPostAttributes = notificationAttributes as BloodPostNotificationAttributes
        const existingItem = await notificationRepository.getItem(
          `NOTIFICATION#${userId}`,
          `${type}#${payload.requestPostId}`
        )

        if (existingItem !== null) {
          return 'Already notified'
        } else {
          await notificationRepository.create({
            ...notificationAttributes,
            id: requestPostAttributes.payload.requestPostId
          })
        }
      } else {
        await notificationRepository.create({
          ...notificationAttributes,
          id: generateUniqueID()
        })
      }

      await snsModel.publish(notificationAttributes, userSnsEndpointArn)
      return 'Notified user successfully.'
    } catch (error) {
      throw new NotificationOperationError(
        `Failed to notify user. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async storeDevice(
    registrationAttributes: SnsRegistrationAttributes,
    userRepository: Repository<UserDetailsDTO>,
    snsModel: SNSModel
  ): Promise<string> {
    try {
      const { userId } = registrationAttributes

      const { snsEndpointArn } = await snsModel.createPlatformEndpoint(
        registrationAttributes
      )
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
        const arnMatch = typedError.message.match(
          /arn:aws:sns:[\w-]+:\d+:endpoint\/\S+/
        )
        const existingArn = arnMatch !== null ? arnMatch[0] : null

        if (existingArn !== null) {
          return await this.handleExistingSnsEndpoint(snsModel, existingArn, userRepository, registrationAttributes)
        }
      }
      throw new Error('Failed to store Endpoint ARN')
    }
  }

  private async handleExistingSnsEndpoint(snsModel: SNSModel, existingArn: string, userRepository: Repository<UserDetailsDTO>, registrationAttributes: SnsRegistrationAttributes): Promise<string> {
    const existingAttributes = await snsModel.getEndpointAttributes(
      existingArn
    )
    const oldUpdateData: Partial<StoreNotificationEndPoint> = {
      id: existingAttributes.CustomUserData,
      snsEndpointArn: '',
      updatedAt: new Date().toISOString()
    }

    await userRepository.update(oldUpdateData)

    await snsModel.setEndpointAttributes(
      existingArn,
      registrationAttributes
    )
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
    notificationAttributes: NotificationAttributes,
    queueModel: QueueModel
  ): Promise<string> {
    try {
      await queueModel.queue(notificationAttributes)
      return 'Device registration successful.'
    } catch (error: unknown) {
      throw new Error('Failed to send notification.')
    }
  }
}
