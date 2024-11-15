import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import { UserDTO } from '../../../commons/dto/UserDTO'
import { NotificationDTO } from '../../../commons/dto/NotificationDTO'
import NotificationOperationError from './NotificationOperationError'
import { NotificationQueueMessage, SnsRegistrationAttributes, StoreNotificationEndPoint } from './Types'
import Repository from '../technicalImpl/policies/repositories/Repository'
import { SNSModel } from '../../application/technicalImpl/sns/SNSModel'
import { generateUniqueID } from '../utils/idGenerator'

export class NotificationService {
  async publishNotification(
    notificationMessage: NotificationQueueMessage,
    notificationRepository: Repository<NotificationDTO>,
    snsModel: SNSModel
  ): Promise<string> {
    try {
      const { userId, type, requestPostId } = notificationMessage
      const existingItem = await notificationRepository.getItem(
        `NOTIFICATION#${userId}`,
        `BLOODREQPOST#${requestPostId}`
      )

      if (type === 'bloodRequestPost' && existingItem !== null) {
        return 'Donor already notified'
      }

      await notificationRepository.create({
        id: generateUniqueID(),
        userId: notificationMessage.userId,
        requestPostId: notificationMessage.requestPostId,
        type: notificationMessage.type,
        title: notificationMessage.payload.title,
        body: notificationMessage.payload.body,
        data: notificationMessage.payload.data
      })

      await snsModel.publish(notificationMessage)
      return 'Notified user successfully.'
    } catch (error) {
      throw new NotificationOperationError(`Failed to create new user. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async storeDevice(registrationAttributes: SnsRegistrationAttributes, userRepository: Repository<UserDTO>, snsModel: SNSModel): Promise<string> {
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
    } catch (error) {
      throw new Error('Failed to store Endpoint ARN')
    }
  }
}