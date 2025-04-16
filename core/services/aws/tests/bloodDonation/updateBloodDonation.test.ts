import updateBloodDonationLambda from '../../bloodDonation/updateBloodDonation'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { mockEvent } from '../cannedData/updateBloodDonationLambdaEvent'
import { UpdateBloodDonationAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import { NotificationService } from '../../../../application/notificationWorkflow/NotificationService'
import { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import BloodDonationDynamoDbOperations from '../../commons/ddbOperations/BloodDonationDynamoDbOperations'
import NotificationDynamoDbOperations from '../../commons/ddbOperations/DonationNotificationDynamoDbOperations'
import { mockServiceLogger } from '../mock/loggerMock'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../../../application/notificationWorkflow/NotificationService')
jest.mock('../../commons/lambda/ApiGateway')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockBloodDonationService = BloodDonationService as jest.MockedClass<
  typeof BloodDonationService
>
const mockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('updateBloodDonationLambda', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return a successful response when blood donation is updated', async () => {
    const mockResponse = { createdAt: expect.any(String), requestPostId: 'req123' }
    mockBloodDonationService.prototype.updateBloodDonation.mockResolvedValue(mockResponse)
    mockNotificationService.prototype.updateBloodDonationNotifications.mockResolvedValue()
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockResponse)
    })

    const result = await updateBloodDonationLambda(
      mockEvent as UpdateBloodDonationAttributes & HttpLoggerAttributes
    )

    expect(result).toEqual({ statusCode: HTTP_CODES.OK, body: JSON.stringify(mockResponse) })
    expect(mockBloodDonationService.prototype.updateBloodDonation).toHaveBeenCalledWith(
      { ...mockEvent },
      expect.any(BloodDonationDynamoDbOperations),
      expect.any(NotificationService),
      expect.any(NotificationDynamoDbOperations),
      mockServiceLogger
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      {
        message: 'We have updated your request and will let you know once there is an update.',
        success: true,
        data: mockResponse
      },
      HTTP_CODES.OK
    )
  })

  it('should return an error response when an error is thrown', async () => {
    const errorMessage = 'Database update failed'
    mockBloodDonationService.prototype.updateBloodDonation.mockRejectedValue(
      new Error(errorMessage)
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result = await updateBloodDonationLambda(
      mockEvent as UpdateBloodDonationAttributes & HttpLoggerAttributes
    )

    expect(result).toEqual({ statusCode: HTTP_CODES.ERROR, body: `Error: ${errorMessage}` })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.ERROR
    )
  })

  it('should filter out empty string values from update attributes', async () => {
    const mockResponse = { createdAt: expect.any(String), requestPostId: 'req123' }
    const eventWithEmptyStrings: UpdateBloodDonationAttributes = {
      ...mockEvent,
      patientName: '',
      transportationInfo: 'Available'
    }

    mockBloodDonationService.prototype.updateBloodDonation.mockResolvedValue(mockResponse)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockResponse)
    })

    await updateBloodDonationLambda(
      eventWithEmptyStrings as UpdateBloodDonationAttributes & HttpLoggerAttributes
    )

    const calledAttributes = mockBloodDonationService.prototype.updateBloodDonation.mock.calls[0][0]
    expect(calledAttributes).not.toHaveProperty('patientName')
    expect(calledAttributes).toHaveProperty('transportationInfo', 'Available')
  })

  it('should handle non-Error objects in error case', async () => {
    const nonErrorObject = { custom: 'error' }
    mockBloodDonationService.prototype.updateBloodDonation.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: 'Error: An unknown error occurred'
    })

    const result = await updateBloodDonationLambda(
      mockEvent as UpdateBloodDonationAttributes & HttpLoggerAttributes
    )

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: 'Error: An unknown error occurred'
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      'Error: An unknown error occurred',
      HTTP_CODES.ERROR
    )
  })

  it('should handle mixed valid and invalid update attributes', async () => {
    const mockResponse = { createdAt: expect.any(String), requestPostId: 'req123' }

    const mixedEvent: UpdateBloodDonationAttributes = {
      ...mockEvent,
      bloodQuantity: 3,
      patientName: '',
      transportationInfo: undefined
    }

    Object.assign(mixedEvent, { invalidKey: 'value' })

    mockBloodDonationService.prototype.updateBloodDonation.mockResolvedValue(mockResponse)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockResponse)
    })

    await updateBloodDonationLambda(
      mixedEvent as UpdateBloodDonationAttributes & HttpLoggerAttributes
    )

    const calledAttributes = mockBloodDonationService.prototype.updateBloodDonation.mock.calls[0][0]

    expect(calledAttributes).toHaveProperty('bloodQuantity', 3)
    expect(calledAttributes).toHaveProperty('seekerId', mockEvent.seekerId)
    expect(calledAttributes).toHaveProperty('requestPostId', mockEvent.requestPostId)

    expect(calledAttributes).not.toHaveProperty('patientName')
    expect(calledAttributes).not.toHaveProperty('transportationInfo')
    expect(calledAttributes).not.toHaveProperty('invalidKey')
  })

  it('should preserve required attributes while filtering invalid ones', async () => {
    const mockResponse = { createdAt: expect.any(String), requestPostId: 'req123' }

    const eventWithExtra: UpdateBloodDonationAttributes & Record<string, unknown> = {
      ...mockEvent,
      extraProperty1: 'value1',
      extraProperty2: 'value2'
    }

    mockBloodDonationService.prototype.updateBloodDonation.mockResolvedValue(mockResponse)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockResponse)
    })

    await updateBloodDonationLambda(
      eventWithExtra as unknown as UpdateBloodDonationAttributes & HttpLoggerAttributes
    )

    const calledAttributes = mockBloodDonationService.prototype.updateBloodDonation.mock.calls[0][0]

    expect(calledAttributes).toHaveProperty('seekerId', mockEvent.seekerId)
    expect(calledAttributes).toHaveProperty('requestPostId', mockEvent.requestPostId)

    expect(calledAttributes).not.toHaveProperty('extraProperty1')
    expect(calledAttributes).not.toHaveProperty('extraProperty2')
  })

  it('should handle allowed keys with valid values', async () => {
    const mockResponse = { createdAt: expect.any(String), requestPostId: 'req123' }

    const eventWithAllowedKeys: UpdateBloodDonationAttributes = {
      ...mockEvent,
      bloodQuantity: 5,
      urgencyLevel: 'urgent',
      donationDateTime: '2024-01-01T00:00:00Z',
      patientName: 'Jane Doe'
    }

    mockBloodDonationService.prototype.updateBloodDonation.mockResolvedValue(mockResponse)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockResponse)
    })

    await updateBloodDonationLambda(
      eventWithAllowedKeys as UpdateBloodDonationAttributes & HttpLoggerAttributes
    )

    const calledAttributes = mockBloodDonationService.prototype.updateBloodDonation.mock.calls[0][0]

    expect(calledAttributes).toHaveProperty('bloodQuantity', 5)
    expect(calledAttributes).toHaveProperty('urgencyLevel', 'urgent')
    expect(calledAttributes).toHaveProperty('donationDateTime', '2024-01-01T00:00:00Z')
    expect(calledAttributes).toHaveProperty('patientName', 'Jane Doe')
  })
})
