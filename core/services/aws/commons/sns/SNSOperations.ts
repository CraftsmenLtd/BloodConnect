import { PublishCommandInput, SNS } from '@aws-sdk/client-sns'
import { SNSModel } from '../../../../application/technicalImpl/sns/SNSModel'
import { NotificationQueueMessage } from '../../../../application/notificationWorkflow/Types'

export default class SNSOperations implements SNSModel {
  private readonly client: SNS

  constructor() {
    this.client = new SNS({ region: process.env.AWS_REGION })
  }

  async publish(message: NotificationQueueMessage): Promise<void> {
    try {
      const snsParams: PublishCommandInput = {
        TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
        Message: JSON.stringify({
          default: JSON.stringify(message.payload),
          GCM: JSON.stringify({
            data: {
              ...message.payload,
              deviceToken: message.deviceToken
            }
          })
        }),
        MessageStructure: 'json'
      }
      await this.client.publish(snsParams)
    } catch (error) {
      throw new Error('Failed to process messages')
    }
  }
}
