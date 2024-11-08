import { SNSModel } from '../../application/technicalImpl/sns/SNSModel'
import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import NotificationOperationError from './NotificationOperationError'
import { NotificationQueueMessage, SnsRegistrationAttributes, StoreNotificationEndPoint } from './Types'
import Repository from '@application/technicalImpl/policies/repositories/Repository'
import { UserDTO } from '@commons/dto/UserDTO'

export class NotificationService {
  async publishNotification(notificationMessage: NotificationQueueMessage, snsModel: SNSModel): Promise<void> {
    try {
      await snsModel.publish(notificationMessage)
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
