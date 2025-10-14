import type { APIGatewayProxyResult } from 'aws-lambda'
import cancelBloodDonation from '../../bloodDonation/cancelBloodDonation'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { DonationRecordEventAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import { DonationStatus } from '../../../../../commons/dto/DonationDTO'
import BloodDonationOperationError from '../../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
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
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('cancelBloodDonation', () => {
  const mockEvent: DonationRecordEventAttributes & HttpLoggerAttributes = {
    seekerId: 'test-seeker-id',
    requestPostId: 'test-request-post-id',
    requestCreatedAt: '2024-01-01T00:00:00.000Z',
    apiGwRequestId: 'test-api-gw-request-id',
    cloudFrontRequestId: 'test-cloudfront-request-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully cancel blood donation and return success response', async () => {
    mockBloodDonationService.prototype.updateDonationStatus.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        message: 'Donation post cancelled successfully',
        success: true
      })
    })

    const result: APIGatewayProxyResult = await cancelBloodDonation(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        message: 'Donation post cancelled successfully',
        success: true
      })
    })
    expect(mockBloodDonationService.prototype.updateDonationStatus).toHaveBeenCalledWith(
      'test-seeker-id',
      'test-request-post-id',
      '2024-01-01T00:00:00.000Z',
      DonationStatus.CANCELLED
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      {
        message: 'Donation post cancelled successfully',
        success: true
      },
      HTTP_CODES.OK
    )
  })

  it('should return error response when standard Error is thrown', async () => {
    const errorMessage = 'Database connection failed'
    mockBloodDonationService.prototype.updateDonationStatus.mockRejectedValue(
      new Error(errorMessage)
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await cancelBloodDonation(mockEvent)

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
    const errorMessage = 'Donation not found'
    const customErrorCode = HTTP_CODES.NOT_FOUND
    const operationError = new BloodDonationOperationError(errorMessage, customErrorCode)

    mockBloodDonationService.prototype.updateDonationStatus.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: customErrorCode,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await cancelBloodDonation(mockEvent)

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
    mockBloodDonationService.prototype.updateDonationStatus.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${UNKNOWN_ERROR_MESSAGE}`
    })

    const result: APIGatewayProxyResult = await cancelBloodDonation(mockEvent)

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
    const complexEvent: DonationRecordEventAttributes & HttpLoggerAttributes = {
      seekerId: 'complex-seeker-id-with-dashes',
      requestPostId: 'complex-request-post-id-with-dashes',
      requestCreatedAt: '2024-12-31T23:59:59.999Z',
      apiGwRequestId: 'complex-api-gw-request-id',
      cloudFrontRequestId: 'complex-cloudfront-request-id'
    }

    mockBloodDonationService.prototype.updateDonationStatus.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        message: 'Donation post cancelled successfully',
        success: true
      })
    })

    await cancelBloodDonation(complexEvent)

    expect(mockBloodDonationService.prototype.updateDonationStatus).toHaveBeenCalledWith(
      'complex-seeker-id-with-dashes',
      'complex-request-post-id-with-dashes',
      '2024-12-31T23:59:59.999Z',
      DonationStatus.CANCELLED
    )
  })

  it('should always use CANCELLED status', async () => {
    mockBloodDonationService.prototype.updateDonationStatus.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        message: 'Donation post cancelled successfully',
        success: true
      })
    })

    await cancelBloodDonation(mockEvent)

    expect(mockBloodDonationService.prototype.updateDonationStatus).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      DonationStatus.CANCELLED
    )
  })

  it('should create BloodDonationService with correct dependencies', async () => {
    mockBloodDonationService.prototype.updateDonationStatus.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        message: 'Donation post cancelled successfully',
        success: true
      })
    })

    await cancelBloodDonation(mockEvent)

    expect(BloodDonationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
  })

  it('should handle BloodDonationOperationError with BAD_REQUEST code', async () => {
    const errorMessage = 'Invalid request'
    const operationError = new BloodDonationOperationError(errorMessage, HTTP_CODES.BAD_REQUEST)

    mockBloodDonationService.prototype.updateDonationStatus.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await cancelBloodDonation(mockEvent)

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
