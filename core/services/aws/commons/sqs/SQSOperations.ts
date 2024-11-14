import { SQS } from '@aws-sdk/client-sqs'
import { SQSModel } from '../../../../application/technicalImpl/sqs/SQSModel'
import { NotificationAttributes, NotificationQueueMessage } from '../../../../application/notificationWorkflow/Types'

export default class SQSOperations implements SQSModel {
  private readonly client: SQS

  constructor() {
    this.client = new SQS({ region: process.env.AWS_REGION })
  }

  async queue(notification: NotificationAttributes, snsEndpointArn: string): Promise<void> {
    const message: NotificationQueueMessage = {
      userId: notification.userId,
      snsEndpointArn,
      type: notification.type,
      payload: {
        title: notification.title,
        body: notification.body,
        data: notification.data
      }
    }
    await this.client.sendMessage({
      QueueUrl: `${process.env.NOTIFICATION_QUEUE_URL}`,
      MessageBody: JSON.stringify(message)
    })
  }
}
