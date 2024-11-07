import { SNSModel } from '../../application/technicalImpl/sns/SNSModel'
import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import NotificationOperationError from './NotificationOperationError'
import { NotificationQueueMessage } from './Types'


export class NotificationService {
  async publishNotification(notificationMessage: NotificationQueueMessage, snsModel: SNSModel): Promise<void> {
    try {
      snsModel.publish(notificationMessage)
    } catch (error) {
      throw new NotificationOperationError(`Failed to create new user. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

}
