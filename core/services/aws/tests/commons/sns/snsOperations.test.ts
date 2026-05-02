import {
  CreatePlatformEndpointCommand,
  PublishCommand,
  SetEndpointAttributesCommand,
  SNS
} from '@aws-sdk/client-sns'
import { mockClient } from 'aws-sdk-client-mock'
import SNSOperations from '../../../commons/sns/SNSOperations'
import type { NotificationAttributes, SnsRegistrationAttributes } from '../../../../../application/notificationWorkflow/Types'
import { NotificationType } from '../../../../../../commons/dto/NotificationDTO'

const snsClientMock = mockClient(SNS)

const MOCK_REGION = 'ap-south-1'
const MOCK_PLATFORM_ARN_APNS = 'arn:aws:sns:ap-south-1:123456789:app/APNS/test-apns'
const MOCK_PLATFORM_ARN_FCM = 'arn:aws:sns:ap-south-1:123456789:app/GCM/test-gcm'
const MOCK_ENDPOINT_ARN = 'arn:aws:sns:ap-south-1:123456789:endpoint/GCM/test-gcm/abc-123'

const mockNotification: NotificationAttributes = {
  userId: 'user-001',
  title: 'Blood Request',
  body: 'Someone needs O+ blood nearby',
  type: NotificationType.BLOOD_REQ_POST,
  payload: {
    requestPostId: 'req-001',
    seekerId: 'seeker-001',
    status: 'pending'
  }
}

const mockFcmRegistration: SnsRegistrationAttributes = {
  userId: 'user-001',
  deviceToken: 'fcm-device-token-abc',
  platform: 'FCM'
}

const mockApnsRegistration: SnsRegistrationAttributes = {
  userId: 'user-002',
  deviceToken: 'apns-device-token-xyz',
  platform: 'APNS'
}

describe('SNSOperations', () => {
  let snsOperations: SNSOperations

  beforeEach(() => {
    snsClientMock.reset()
    snsOperations = new SNSOperations(MOCK_REGION, MOCK_PLATFORM_ARN_APNS, MOCK_PLATFORM_ARN_FCM)
  })

  describe('publish()', () => {
    test('sends message using fcmV1Message format with GCM wrapper', async() => {
      snsClientMock.on(PublishCommand).resolves({ MessageId: 'msg-123' })

      await snsOperations.publish(mockNotification, MOCK_ENDPOINT_ARN)

      const call = snsClientMock.calls()[0].args[0] as PublishCommand
      expect(call.input.TargetArn).toBe(MOCK_ENDPOINT_ARN)
      expect(call.input.MessageStructure).toBe('json')

      const parsedMessage = JSON.parse(call.input.Message as string)
      expect(parsedMessage.default).toBe('Blood Connect')

      const gcmPayload = JSON.parse(parsedMessage.GCM)
      expect(gcmPayload.fcmV1Message).toBeDefined()
      expect(gcmPayload.fcmV1Message.message.notification.title).toBe(mockNotification.title)
      expect(gcmPayload.fcmV1Message.message.notification.body).toBe(mockNotification.body)
    })

    test('serializes payload as JSON string in data field (FCM v1 requires string values)', async() => {
      snsClientMock.on(PublishCommand).resolves({ MessageId: 'msg-123' })

      await snsOperations.publish(mockNotification, MOCK_ENDPOINT_ARN)

      const call = snsClientMock.calls()[0].args[0] as PublishCommand
      const gcmPayload = JSON.parse(JSON.parse(call.input.Message as string).GCM)
      const data = gcmPayload.fcmV1Message.message.data

      expect(typeof data.payload).toBe('string')
      expect(JSON.parse(data.payload)).toEqual(mockNotification.payload)
      expect(data.type).toBe(mockNotification.type)
    })

    test('preserves original SNS error message when publish fails', async() => {
      snsClientMock.on(PublishCommand).rejects(new Error('EndpointDisabled'))

      await expect(snsOperations.publish(mockNotification, MOCK_ENDPOINT_ARN))
        .rejects.toThrow('Failed to process messages: EndpointDisabled')
    })
  })

  describe('setEndpointAttributes()', () => {
    test('sets Token, Enabled, and CustomUserData on the endpoint', async() => {
      snsClientMock.on(SetEndpointAttributesCommand).resolves({})

      await snsOperations.setEndpointAttributes(MOCK_ENDPOINT_ARN, mockFcmRegistration)

      const call = snsClientMock.calls()[0].args[0] as SetEndpointAttributesCommand
      expect(call.input.EndpointArn).toBe(MOCK_ENDPOINT_ARN)
      expect(call.input.Attributes?.CustomUserData).toBe(mockFcmRegistration.userId)
      expect(call.input.Attributes?.Token).toBe(mockFcmRegistration.deviceToken)
      expect(call.input.Attributes?.Enabled).toBe('true')
    })

    test('throws with original error message when SNS call fails', async() => {
      snsClientMock.on(SetEndpointAttributesCommand).rejects(new Error('InvalidEndpointArn'))

      await expect(snsOperations.setEndpointAttributes(MOCK_ENDPOINT_ARN, mockFcmRegistration))
        .rejects.toThrow('Failed to set endpoint attributes')
    })
  })

  describe('createPlatformEndpoint()', () => {
    test('creates FCM endpoint and returns snsEndpointArn', async() => {
      snsClientMock.on(CreatePlatformEndpointCommand).resolves({ EndpointArn: MOCK_ENDPOINT_ARN })

      const result = await snsOperations.createPlatformEndpoint(mockFcmRegistration)

      expect(result.snsEndpointArn).toBe(MOCK_ENDPOINT_ARN)
      const call = snsClientMock.calls()[0].args[0] as CreatePlatformEndpointCommand
      expect(call.input.PlatformApplicationArn).toBe(MOCK_PLATFORM_ARN_FCM)
      expect(call.input.Token).toBe(mockFcmRegistration.deviceToken)
      expect(call.input.CustomUserData).toBe(mockFcmRegistration.userId)
    })

    test('creates APNS endpoint and returns snsEndpointArn', async() => {
      const apnsEndpointArn = 'arn:aws:sns:ap-south-1:123456789:endpoint/APNS/test-apns/xyz-456'
      snsClientMock.on(CreatePlatformEndpointCommand).resolves({ EndpointArn: apnsEndpointArn })

      const result = await snsOperations.createPlatformEndpoint(mockApnsRegistration)

      expect(result.snsEndpointArn).toBe(apnsEndpointArn)
      const call = snsClientMock.calls()[0].args[0] as CreatePlatformEndpointCommand
      expect(call.input.PlatformApplicationArn).toBe(MOCK_PLATFORM_ARN_APNS)
      expect(call.input.Token).toBe(mockApnsRegistration.deviceToken)
    })

    test('throws for unsupported platform', async() => {
      const unsupportedRegistration = { ...mockFcmRegistration, platform: 'WINDOWS' as 'FCM' }

      await expect(snsOperations.createPlatformEndpoint(unsupportedRegistration))
        .rejects.toThrow('Unsupported platform')
    })
  })
})
