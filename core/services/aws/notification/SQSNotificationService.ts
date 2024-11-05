/* eslint-disable no-console */
import { SQS } from '@aws-sdk/client-sqs'
import { NotificationQueueMessage } from '../../../../commons/dto/NotificationDTO'

export class SQSNotificationService {
  constructor(private readonly sqs: SQS) {}

  async queueNotification(message: NotificationQueueMessage, queueUrl: string): Promise<void> {
    console.log('sqs mesg param', message)
    await this.sqs.sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message)
    })
  }
}
