import { SQS } from '@aws-sdk/client-sqs'
import {
  DonationNotificationAttributes,
  NotificationAttributes
} from '../../../../application/notificationWorkflow/Types'
import { QueueModel } from '../../../../application/models/queue/QueueModel'

export default class SQSOperations implements QueueModel {
  private readonly client: SQS

  constructor() {
    this.client = new SQS({ region: process.env.AWS_REGION })
  }

  async queue(
    notification: NotificationAttributes | DonationNotificationAttributes
  ): Promise<void> {
    await this.client.sendMessage({
      QueueUrl: `${process.env.NOTIFICATION_QUEUE_URL}`,
      MessageBody: JSON.stringify(notification)
    })
  }
}
