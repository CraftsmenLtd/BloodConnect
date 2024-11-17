import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import { UserDTO } from '../../../commons/dto/UserDTO'
import { NotificationDTO } from '../../../commons/dto/NotificationDTO'
import NotificationOperationError from './NotificationOperationError'
import {
  NotificationAttributes,
  NotificationQueueMessage,
  SnsRegistrationAttributes,
  StoreNotificationEndPoint
} from './Types'
import Repository from '../models/policies/repositories/Repository'
import { SNSModel } from '../models/sns/SNSModel'
import { generateUniqueID } from '../utils/idGenerator'
import { SQSModel } from '../models/sqs/SQSModel'

export class NotificationService {
  async publishNotification(
    notificationMessage: NotificationQueueMessage,
    notificationRepository: Repository<NotificationDTO>,
    snsModel: SNSModel
  ): Promise<string> {
    try {
      const { userId, type, payload } = notificationMessage

      if (payload.data !== undefined && type === 'bloodRequestPost') {
        const existingItem = await notificationRepository.getItem(
          `NOTIFICATION#${userId}`,
          `BLOODREQPOST#${payload.data.requestPostId}`
        )

        if (existingItem !== null) {
          return 'Donor already notified'
        }
      }

      await notificationRepository.create({
        id: generateUniqueID(),
        userId: notificationMessage.userId,
        type: notificationMessage.type,
        title: notificationMessage.payload.title,
        body: notificationMessage.payload.body,
        data: notificationMessage.payload.data
      })

      await snsModel.publish(notificationMessage)
      return 'Notified user successfully.'
    } catch (error) {
      throw new NotificationOperationError(
        `Failed to create new user. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async storeDevice(
    registrationAttributes: SnsRegistrationAttributes,
    userRepository: Repository<UserDTO>,
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
      if (
        typedError.name === 'InvalidParameterException' &&
        typedError.message.includes('Device already registered with this Token')
      ) {
        const arnMatch = typedError.message.match(
          /arn:aws:sns:[\w-]+:\d+:endpoint\/\S+/
        )
        const existingArn = arnMatch !== null ? arnMatch[0] : null

        if (existingArn !== null) {
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
      }
      throw new Error('Failed to store Endpoint ARN')
    }
  }

  async pushNotification(
    notificationAttributes: NotificationAttributes,
    userSnsEndpointArn: string,
    sqsModel: SQSModel
  ): Promise<string> {
    try {
      await sqsModel.queue(notificationAttributes, userSnsEndpointArn)
      return 'Notification Queued Successfully'
    } catch (error) {
      throw new NotificationOperationError(
        `Failed to update user. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }
}
