import { CreatePlatformEndpointCommand, PublishCommand, SNS } from '@aws-sdk/client-sns'
import { SNSModel } from '../../../../application/technicalImpl/sns/SNSModel'
import { NotificationQueueMessage, SnsRegistrationAttributes } from '../../../../application/notificationWorkflow/Types'

const PLATFORM_ARN_APNS = process.env.PLATFORM_ARN_APNS
const PLATFORM_ARN_FCM = process.env.PLATFORM_ARN_FCM

export default class SNSOperations implements SNSModel {
  private readonly client: SNS

  constructor() {
    this.client = new SNS({ region: process.env.AWS_REGION })
  }

  async publish(message: NotificationQueueMessage): Promise<void> {
    try {
      const messagePayload = {
        notification: {
          title: message.payload.title,
          body: message.payload.body
        },
        data: {
          notificationData: {
            ...message.payload.data
          },
          screen: 'PatientDetailsScreen'
        }
      }
      const command = new PublishCommand({
        Message: JSON.stringify({
          default: 'Blood Connect',
          GCM: JSON.stringify(messagePayload)
        }),
        MessageStructure: 'json',
        TargetArn: message.snsEndpointArn
      })
      await this.client.send(command)
    } catch (error) {
      throw new Error('Failed to process messages')
    }
  }

  async createPlatformEndpoint(attributes: SnsRegistrationAttributes): Promise<{ snsEndpointArn: string }> {
    const { userId, deviceToken, platform } = attributes
    let platformApplicationArn
    if (platform === 'APNS') {
      platformApplicationArn = PLATFORM_ARN_APNS
    } else if (platform === 'FCM') {
      platformApplicationArn = PLATFORM_ARN_FCM
    } else {
      throw new Error("Unsupported platform. Use 'APNS' for iOS or 'FCM' for Android.")
    }
    const createEndpointCommand = new CreatePlatformEndpointCommand({
      PlatformApplicationArn: platformApplicationArn,
      Token: deviceToken,
      CustomUserData: userId
    })

    const response = await this.client.send(createEndpointCommand)
    return { snsEndpointArn: `${response.EndpointArn}` }
  }
}
