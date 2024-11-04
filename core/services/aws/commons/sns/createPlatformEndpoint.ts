import { SNSClient, CreatePlatformEndpointCommand } from '@aws-sdk/client-sns'

export interface SnsRegistrationAttributes {
  userId: string;
  deviceToken: string;
  platform: 'APNS' | 'FCM';
}

const snsClient = new SNSClient({ region: process.env.AWS_REGION })
const PLATFORM_ARN_APNS = process.env.PLATFORM_ARN_APNS
const PLATFORM_ARN_FCM = process.env.PLATFORM_ARN_FCM

export const createPlatformEndpoint = async(attributes: SnsRegistrationAttributes): Promise<{ endpointArn: string }> => {
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

  const response = await snsClient.send(createEndpointCommand)
  const endpointArn = response.EndpointArn
  return { endpointArn }
}
