import {
  CreatePlatformEndpointCommand,
  GetEndpointAttributesCommand,
  PublishCommand,
  SetEndpointAttributesCommand,
  SNS
} from '@aws-sdk/client-sns'
import type { SNSModel } from '../../../../application/models/sns/SNSModel'
import type {
  NotificationAttributes,
  SnsRegistrationAttributes
} from '../../../../application/notificationWorkflow/Types'


export default class SNSOperations implements SNSModel {
  private readonly client: SNS

  constructor(
    protected readonly region: string,
    protected readonly platformArnApns: string,
    protected readonly platformArnFcm: string
  ) {
    this.client = new SNS({ region })
  }

  async publish(message: NotificationAttributes, snsEndpointArn: string): Promise<void> {
    try {
      const messagePayload = {
        notification: {
          title: message.title,
          body: message.body
        },
        data: {
          title: message.title,
          body: message.body,
          type: message.type,
          payload: message.payload
        }
      }
      const command = new PublishCommand({
        Message: JSON.stringify({
          default: 'Blood Connect',
          GCM: JSON.stringify(messagePayload)
        }),
        MessageStructure: 'json',
        TargetArn: snsEndpointArn
      })
      await this.client.send(command)
    } catch (error) {
      throw new Error('Failed to process messages')
    }
  }

  async createPlatformEndpoint(
    attributes: SnsRegistrationAttributes
  ): Promise<{ snsEndpointArn: string }> {
    const { userId, deviceToken, platform } = attributes

    if (platform === 'APNS') {
      const createEndpointCommand = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: this.platformArnApns,
        Token: deviceToken,
        CustomUserData: userId
      })

      const response = await this.client.send(createEndpointCommand)
      return { snsEndpointArn: `${response.EndpointArn}` }
    } else if (platform === 'FCM') {
      const createEndpointCommand = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: this.platformArnFcm,
        Token: deviceToken,
        CustomUserData: userId
      })

      const response = await this.client.send(createEndpointCommand)
      return { snsEndpointArn: `${response.EndpointArn}` }
    } else {
      throw new Error(
        'Unsupported platform. Use "APNS" for iOS or "FCM" for Android.'
      )
    }
  }

  async getEndpointAttributes(
    existingArn: string
  ): Promise<Record<string, string>> {
    try {
      const command = new GetEndpointAttributesCommand({
        EndpointArn: existingArn
      })
      const response = await this.client.send(command)
      return response.Attributes ?? {}
    } catch (error) {
      throw new Error(`Failed to get endpoint attributes: ${error}`)
    }
  }

  async setEndpointAttributes(
    existingArn: string,
    attributes: SnsRegistrationAttributes
  ): Promise<void> {
    try {
      const { userId } = attributes
      const command = new SetEndpointAttributesCommand({
        EndpointArn: existingArn,
        Attributes: {
          CustomUserData: userId
        }
      })
      await this.client.send(command)
    } catch (error) {
      throw new Error(`Failed to set endpoint attributes: ${error}`)
    }
  }
}
