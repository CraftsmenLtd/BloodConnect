import type { APIGatewayProxyResult } from 'aws-lambda'
import registerUserDeviceLambda from '../../notification/registerUserDevice'
import { NotificationService } from '../../../../application/notificationWorkflow/NotificationService'
import { UserService } from '../../../../application/userWorkflow/UserService'
import SNSOperations from '../../commons/sns/SNSOperations'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { SnsRegistrationAttributes } from '../../../../application/notificationWorkflow/Types'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import BloodDonationOperationError from '../../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'

jest.mock('../../../../application/notificationWorkflow/NotificationService')
jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../commons/sns/SNSOperations')
jest.mock('../../commons/lambda/ApiGateway')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>
const mockUserService = UserService as jest.MockedClass<typeof UserService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('registerUserDeviceLambda', () => {
  const mockEvent: SnsRegistrationAttributes & HttpLoggerAttributes = {
    userId: 'test-user-id',
    deviceToken: 'test-device-token-12345',
    platform: 'ios',
    apiGwRequestId: 'test-api-gw-request-id',
    cloudFrontRequestId: 'test-cloudfront-request-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully register user device and return success response', async () => {
    const successMessage = 'Device registered successfully'
    mockNotificationService.prototype.storeDevice.mockResolvedValue(successMessage)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: successMessage })
    })

    const result: APIGatewayProxyResult = await registerUserDeviceLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: successMessage })
    })
    expect(mockNotificationService.prototype.storeDevice).toHaveBeenCalledWith(
      {
        userId: 'test-user-id',
        deviceToken: 'test-device-token-12345',
        platform: 'ios'
      },
      expect.any(Object),
      expect.any(Object)
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { message: successMessage },
      HTTP_CODES.OK
    )
  })

  it('should handle android platform registration', async () => {
    const androidEvent = { ...mockEvent, platform: 'android' }
    const successMessage = 'Android device registered successfully'
    mockNotificationService.prototype.storeDevice.mockResolvedValue(successMessage)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: successMessage })
    })

    const result: APIGatewayProxyResult = await registerUserDeviceLambda(androidEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: successMessage })
    })
    expect(mockNotificationService.prototype.storeDevice).toHaveBeenCalledWith(
      {
        userId: 'test-user-id',
        deviceToken: 'test-device-token-12345',
        platform: 'android'
      },
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should return error response when standard Error is thrown', async () => {
    const errorMessage = 'SNS endpoint creation failed'
    mockNotificationService.prototype.storeDevice.mockRejectedValue(new Error(errorMessage))
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await registerUserDeviceLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.ERROR
    )
  })

  it('should handle BloodDonationOperationError with custom error code', async () => {
    const errorMessage = 'User not found'
    const customErrorCode = HTTP_CODES.NOT_FOUND
    const operationError = new BloodDonationOperationError(errorMessage, customErrorCode)

    mockNotificationService.prototype.storeDevice.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: customErrorCode,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await registerUserDeviceLambda(mockEvent)

    expect(result).toEqual({
      statusCode: customErrorCode,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      customErrorCode
    )
  })

  it('should handle non-Error objects with default error message', async () => {
    const nonErrorObject = { random: 'error' }
    mockNotificationService.prototype.storeDevice.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${UNKNOWN_ERROR_MESSAGE}`
    })

    const result: APIGatewayProxyResult = await registerUserDeviceLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${UNKNOWN_ERROR_MESSAGE}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${UNKNOWN_ERROR_MESSAGE}`,
      HTTP_CODES.ERROR
    )
  })

  it('should pass all event attributes correctly', async () => {
    const complexEvent: SnsRegistrationAttributes & HttpLoggerAttributes = {
      userId: 'complex-user-id-with-dashes',
      deviceToken: 'very-long-device-token-with-special-chars-!@#$%',
      platform: 'ios',
      apiGwRequestId: 'complex-api-gw-request-id',
      cloudFrontRequestId: 'complex-cloudfront-request-id'
    }

    const successMessage = 'Device registered successfully'
    mockNotificationService.prototype.storeDevice.mockResolvedValue(successMessage)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: successMessage })
    })

    await registerUserDeviceLambda(complexEvent)

    expect(mockNotificationService.prototype.storeDevice).toHaveBeenCalledWith(
      {
        userId: 'complex-user-id-with-dashes',
        deviceToken: 'very-long-device-token-with-special-chars-!@#$%',
        platform: 'ios'
      },
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should create services with correct dependencies', async () => {
    const successMessage = 'Device registered successfully'
    mockNotificationService.prototype.storeDevice.mockResolvedValue(successMessage)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: successMessage })
    })

    await registerUserDeviceLambda(mockEvent)

    expect(NotificationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(UserService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
  })

  it('should handle device token update for existing user', async () => {
    const updateMessage = 'Device token updated successfully'
    mockNotificationService.prototype.storeDevice.mockResolvedValue(updateMessage)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: updateMessage })
    })

    const result: APIGatewayProxyResult = await registerUserDeviceLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: updateMessage })
    })
  })

  it('should handle validation errors gracefully', async () => {
    const validationError = new Error('Invalid device token format')
    mockNotificationService.prototype.storeDevice.mockRejectedValue(validationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: 'Error: Invalid device token format'
    })

    const result: APIGatewayProxyResult = await registerUserDeviceLambda(mockEvent)

    expect(result.statusCode).toBe(HTTP_CODES.ERROR)
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      'Error: Invalid device token format',
      HTTP_CODES.ERROR
    )
  })

  it('should handle BloodDonationOperationError with BAD_REQUEST code', async () => {
    const errorMessage = 'Invalid platform specified'
    const operationError = new BloodDonationOperationError(errorMessage, HTTP_CODES.BAD_REQUEST)

    mockNotificationService.prototype.storeDevice.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await registerUserDeviceLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.BAD_REQUEST
    )
  })
})
