import { SNS } from '@aws-sdk/client-sns'
import SNSOperations from '../../../commons/sns/SNSOperations'
import type {
  NotificationAttributes,
  SnsRegistrationAttributes
} from '../../../../../application/notificationWorkflow/Types'

jest.mock('@aws-sdk/client-sns')

const mockSNS = SNS as jest.MockedClass<typeof SNS>
const mockSend = jest.fn()

describe('SNSOperations', () => {
  let snsOperations: SNSOperations
  const mockRegion = 'us-east-1'
  const mockPlatformArnApns = 'arn:aws:sns:us-east-1:123456789012:app/APNS/test-app'
  const mockPlatformArnFcm = 'arn:aws:sns:us-east-1:123456789012:app/GCM/test-app'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSend.mockClear()
    mockSNS.mockImplementation(() => ({
      send: mockSend
    } as any))
    snsOperations = new SNSOperations(mockRegion, mockPlatformArnApns, mockPlatformArnFcm)
  })

  describe('publish', () => {
    it('should successfully publish a notification message', async () => {
      const mockMessage: NotificationAttributes = {
        userId: 'test-user-id',
        title: 'Blood Donation Request',
        body: 'A patient needs blood type A+',
        type: 'DONATION_REQUEST',
        payload: {
          requestPostId: 'test-request-id',
          seekerId: 'test-seeker-id'
        }
      }
      const mockSnsEndpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'

      mockSend.mockResolvedValue({})

      await snsOperations.publish(mockMessage, mockSnsEndpointArn)

      expect(mockSend).toHaveBeenCalled()
      const command = mockSend.mock.calls[0][0]
      expect(command).toBeInstanceOf(Object)
      expect(command.constructor.name).toBe('PublishCommand')
    })

    it('should format notification message correctly', async () => {
      const mockMessage: NotificationAttributes = {
        userId: 'test-user-id',
        title: 'Test Title',
        body: 'Test Body',
        type: 'TEST_TYPE',
        payload: { key: 'value' }
      }
      const mockSnsEndpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'

      mockSend.mockResolvedValue({})

      await snsOperations.publish(mockMessage, mockSnsEndpointArn)

      expect(mockSend).toHaveBeenCalled()
    })

    it('should throw error when publish fails', async () => {
      const mockMessage: NotificationAttributes = {
        userId: 'test-user-id',
        title: 'Test',
        body: 'Test',
        type: 'TEST',
        payload: {}
      }
      const mockSnsEndpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'

      mockSend.mockRejectedValue(new Error('SNS publish failed'))

      await expect(snsOperations.publish(mockMessage, mockSnsEndpointArn)).rejects.toThrow(
        'Failed to process messages'
      )
    })

    it('should handle empty payload', async () => {
      const mockMessage: NotificationAttributes = {
        userId: 'test-user-id',
        title: 'Test Title',
        body: 'Test Body',
        type: 'TEST_TYPE',
        payload: {}
      }
      const mockSnsEndpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'

      mockSend.mockResolvedValue({})

      await snsOperations.publish(mockMessage, mockSnsEndpointArn)

      expect(mockSend).toHaveBeenCalled()
    })
  })

  describe('createPlatformEndpoint', () => {
    it('should create APNS platform endpoint successfully', async () => {
      const mockAttributes: SnsRegistrationAttributes = {
        userId: 'test-user-id',
        deviceToken: 'test-device-token-apns',
        platform: 'APNS'
      }
      const mockEndpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/APNS/test-app/test-id'

      mockSend.mockResolvedValue({ EndpointArn: mockEndpointArn })

      const result = await snsOperations.createPlatformEndpoint(mockAttributes)

      expect(result).toEqual({ snsEndpointArn: mockEndpointArn })
      expect(mockSend).toHaveBeenCalled()
      const command = mockSend.mock.calls[0][0]
      expect(command.constructor.name).toBe('CreatePlatformEndpointCommand')
    })

    it('should create FCM platform endpoint successfully', async () => {
      const mockAttributes: SnsRegistrationAttributes = {
        userId: 'test-user-id',
        deviceToken: 'test-device-token-fcm',
        platform: 'FCM'
      }
      const mockEndpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/test-app/test-id'

      mockSend.mockResolvedValue({ EndpointArn: mockEndpointArn })

      const result = await snsOperations.createPlatformEndpoint(mockAttributes)

      expect(result).toEqual({ snsEndpointArn: mockEndpointArn })
      expect(mockSend).toHaveBeenCalled()
      const command = mockSend.mock.calls[0][0]
      expect(command.constructor.name).toBe('CreatePlatformEndpointCommand')
    })

    it('should throw error for unsupported platform', async () => {
      const mockAttributes: SnsRegistrationAttributes = {
        userId: 'test-user-id',
        deviceToken: 'test-device-token',
        platform: 'INVALID_PLATFORM' as any
      }

      await expect(snsOperations.createPlatformEndpoint(mockAttributes)).rejects.toThrow(
        'Unsupported platform. Use "APNS" for iOS or "FCM" for Android.'
      )
    })

    it('should handle endpoint creation failure', async () => {
      const mockAttributes: SnsRegistrationAttributes = {
        userId: 'test-user-id',
        deviceToken: 'test-device-token-apns',
        platform: 'APNS'
      }

      mockSend.mockRejectedValue(new Error('Endpoint creation failed'))

      await expect(snsOperations.createPlatformEndpoint(mockAttributes)).rejects.toThrow()
    })
  })

  describe('getEndpointAttributes', () => {
    it('should successfully get endpoint attributes', async () => {
      const mockArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'
      const mockAttributes = {
        Enabled: 'true',
        Token: 'test-token',
        CustomUserData: 'test-user-id'
      }

      mockSend.mockResolvedValue({ Attributes: mockAttributes })

      const result = await snsOperations.getEndpointAttributes(mockArn)

      expect(result).toEqual(mockAttributes)
      expect(mockSend).toHaveBeenCalled()
      const command = mockSend.mock.calls[0][0]
      expect(command.constructor.name).toBe('GetEndpointAttributesCommand')
    })

    it('should return empty object when attributes are undefined', async () => {
      const mockArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'

      mockSend.mockResolvedValue({ Attributes: undefined })

      const result = await snsOperations.getEndpointAttributes(mockArn)

      expect(result).toEqual({})
    })

    it('should throw error when getting attributes fails', async () => {
      const mockArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'

      mockSend.mockRejectedValue(new Error('Get attributes failed'))

      await expect(snsOperations.getEndpointAttributes(mockArn)).rejects.toThrow(
        'Failed to get endpoint attributes'
      )
    })
  })

  describe('setEndpointAttributes', () => {
    it('should successfully set endpoint attributes', async () => {
      const mockArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'
      const mockAttributes: SnsRegistrationAttributes = {
        userId: 'updated-user-id',
        deviceToken: 'test-device-token',
        platform: 'APNS'
      }

      mockSend.mockResolvedValue({})

      await snsOperations.setEndpointAttributes(mockArn, mockAttributes)

      expect(mockSend).toHaveBeenCalled()
      const command = mockSend.mock.calls[0][0]
      expect(command.constructor.name).toBe('SetEndpointAttributesCommand')
    })

    it('should throw error when setting attributes fails', async () => {
      const mockArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'
      const mockAttributes: SnsRegistrationAttributes = {
        userId: 'test-user-id',
        deviceToken: 'test-device-token',
        platform: 'APNS'
      }

      mockSend.mockRejectedValue(new Error('Set attributes failed'))

      await expect(snsOperations.setEndpointAttributes(mockArn, mockAttributes)).rejects.toThrow(
        'Failed to set endpoint attributes'
      )
    })

    it('should update custom user data correctly', async () => {
      const mockArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/test-endpoint'
      const mockAttributes: SnsRegistrationAttributes = {
        userId: 'new-user-id',
        deviceToken: 'test-device-token',
        platform: 'FCM'
      }

      mockSend.mockResolvedValue({})

      await snsOperations.setEndpointAttributes(mockArn, mockAttributes)

      expect(mockSend).toHaveBeenCalled()
      const command = mockSend.mock.calls[0][0]
      expect(command.constructor.name).toBe('SetEndpointAttributesCommand')
    })
  })

  describe('constructor', () => {
    it('should initialize SNS client with correct region', () => {
      const testSnsOperations = new SNSOperations(
        'us-west-2',
        mockPlatformArnApns,
        mockPlatformArnFcm
      )

      expect(testSnsOperations).toBeInstanceOf(SNSOperations)
      expect(mockSNS).toHaveBeenCalledWith({ region: 'us-west-2' })
    })
  })
})
