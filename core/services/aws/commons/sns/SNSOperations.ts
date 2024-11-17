import {
  CreatePlatformEndpointCommand,
  GetEndpointAttributesCommand,
  PublishCommand,
  SetEndpointAttributesCommand,
  SNS,
} from "@aws-sdk/client-sns";
import { SNSModel } from "../../../../application/models2/sns/SNSModel";
import {
  NotificationQueueMessage,
  SnsRegistrationAttributes,
} from "../../../../application/notificationWorkflow/Types";

const PLATFORM_ARN_APNS = process.env.PLATFORM_ARN_APNS;
const PLATFORM_ARN_FCM = process.env.PLATFORM_ARN_FCM;

export default class SNSOperations implements SNSModel {
  private readonly client: SNS;

  constructor() {
    this.client = new SNS({ region: process.env.AWS_REGION });
  }

  async publish(message: NotificationQueueMessage): Promise<void> {
    try {
      const messagePayload = {
        notification: {
          title: message.payload.title,
          body: message.payload.body,
        },
        data: {
          notificationData: {
            ...message.payload.data,
          },
          type: message.type,
        },
      };
      const command = new PublishCommand({
        Message: JSON.stringify({
          default: "Blood Connect",
          GCM: JSON.stringify(messagePayload),
        }),
        MessageStructure: "json",
        TargetArn: message.snsEndpointArn,
      });
      await this.client.send(command);
    } catch (error) {
      throw new Error("Failed to process messages");
    }
  }

  async createPlatformEndpoint(
    attributes: SnsRegistrationAttributes
  ): Promise<{ snsEndpointArn: string }> {
    const { userId, deviceToken, platform } = attributes;

    if (platform === "APNS") {
      const createEndpointCommand = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: PLATFORM_ARN_APNS,
        Token: deviceToken,
        CustomUserData: userId,
      });

      const response = await this.client.send(createEndpointCommand);
      return { snsEndpointArn: `${response.EndpointArn}` };
    } else if (platform === "FCM") {
      const createEndpointCommand = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: PLATFORM_ARN_FCM,
        Token: deviceToken,
        CustomUserData: userId,
      });

      const response = await this.client.send(createEndpointCommand);
      return { snsEndpointArn: `${response.EndpointArn}` };
    } else {
      throw new Error(
        "Unsupported platform. Use 'APNS' for iOS or 'FCM' for Android."
      );
    }
  }

  async getEndpointAttributes(
    existingArn: string
  ): Promise<Record<string, string>> {
    try {
      const command = new GetEndpointAttributesCommand({
        EndpointArn: existingArn,
      });
      const response = await this.client.send(command);
      return response.Attributes ?? {};
    } catch (error) {
      throw new Error(`Failed to get endpoint attributes: ${error}`);
    }
  }

  async setEndpointAttributes(
    existingArn: string,
    attributes: SnsRegistrationAttributes
  ): Promise<void> {
    try {
      const { userId } = attributes;
      const command = new SetEndpointAttributesCommand({
        EndpointArn: existingArn,
        Attributes: {
          CustomUserData: userId,
        },
      });
      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to set endpoint attributes: ${error}`);
    }
  }
}
