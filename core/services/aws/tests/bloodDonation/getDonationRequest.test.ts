import type { APIGatewayProxyResult } from 'aws-lambda'
import getDonationRequestLambda from '../../bloodDonation/getDonationRequest'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import { AcceptDonationService } from '../../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { GetDonationRequestAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import DonationRecordOperationError from '../../../../application/bloodDonationWorkflow/DonationRecordOperationError'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../../../application/bloodDonationWorkflow/AcceptDonationRequestService')
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

describe('getDonationRequestLambda', () => {
  const mockEvent: GetDonationRequestAttributes & HttpLoggerAttributes = {
    seekerId: 'test-seeker-id',
    requestPostId: 'test-request-post-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    apiGwRequestId: 'test-api-gw-request-id',
    cloudFrontRequestId: 'test-cloudfront-request-id'
  }

  const mockDonationDetails = {
    seekerId: 'test-seeker-id',
    requestPostId: 'test-request-post-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    bloodType: 'A+',
    location: 'Test Location',
    status: 'ACTIVE'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully retrieve donation request details and return success response', async () => {
    mockBloodDonationService.prototype.getDonationRequestDetails.mockResolvedValue(
      mockDonationDetails
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        success: true,
        data: mockDonationDetails,
        message: 'Donation completed and donation record added successfully'
      })
    })

    const result: APIGatewayProxyResult = await getDonationRequestLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        success: true,
        data: mockDonationDetails,
        message: 'Donation completed and donation record added successfully'
      })
    })
    expect(mockBloodDonationService.prototype.getDonationRequestDetails).toHaveBeenCalledWith(
      'test-seeker-id',
      'test-request-post-id',
      '2024-01-01T00:00:00.000Z',
      expect.any(AcceptDonationService)
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      {
        success: true,
        data: mockDonationDetails,
        message: 'Donation completed and donation record added successfully'
      },
      HTTP_CODES.OK
    )
  })

  it('should return error response when standard Error is thrown', async () => {
    const errorMessage = 'Database connection failed'
    mockBloodDonationService.prototype.getDonationRequestDetails.mockRejectedValue(
      new Error(errorMessage)
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await getDonationRequestLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.ERROR
    )
  })

  it('should handle DonationRecordOperationError with custom error code', async () => {
    const errorMessage = 'Donation record not found'
    const customErrorCode = HTTP_CODES.NOT_FOUND
    const operationError = new DonationRecordOperationError(errorMessage, customErrorCode)

    mockBloodDonationService.prototype.getDonationRequestDetails.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: customErrorCode,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await getDonationRequestLambda(mockEvent)

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
    mockBloodDonationService.prototype.getDonationRequestDetails.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${UNKNOWN_ERROR_MESSAGE}`
    })

    const result: APIGatewayProxyResult = await getDonationRequestLambda(mockEvent)

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
    const complexEvent: GetDonationRequestAttributes & HttpLoggerAttributes = {
      seekerId: 'complex-seeker-id-with-dashes',
      requestPostId: 'complex-request-post-id-with-dashes',
      createdAt: '2024-12-31T23:59:59.999Z',
      apiGwRequestId: 'complex-api-gw-request-id',
      cloudFrontRequestId: 'complex-cloudfront-request-id'
    }

    const complexDonationDetails = {
      ...mockDonationDetails,
      seekerId: 'complex-seeker-id-with-dashes',
      requestPostId: 'complex-request-post-id-with-dashes',
      createdAt: '2024-12-31T23:59:59.999Z'
    }

    mockBloodDonationService.prototype.getDonationRequestDetails.mockResolvedValue(
      complexDonationDetails
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        success: true,
        data: complexDonationDetails,
        message: 'Donation completed and donation record added successfully'
      })
    })

    await getDonationRequestLambda(complexEvent)

    expect(mockBloodDonationService.prototype.getDonationRequestDetails).toHaveBeenCalledWith(
      'complex-seeker-id-with-dashes',
      'complex-request-post-id-with-dashes',
      '2024-12-31T23:59:59.999Z',
      expect.any(AcceptDonationService)
    )
  })

  it('should create services with correct dependencies', async () => {
    mockBloodDonationService.prototype.getDonationRequestDetails.mockResolvedValue(
      mockDonationDetails
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        success: true,
        data: mockDonationDetails,
        message: 'Donation completed and donation record added successfully'
      })
    })

    await getDonationRequestLambda(mockEvent)

    expect(BloodDonationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(AcceptDonationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
  })

  it('should handle DonationRecordOperationError with BAD_REQUEST code', async () => {
    const errorMessage = 'Invalid request parameters'
    const operationError = new DonationRecordOperationError(errorMessage, HTTP_CODES.BAD_REQUEST)

    mockBloodDonationService.prototype.getDonationRequestDetails.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await getDonationRequestLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.BAD_REQUEST
    )
  })

  it('should return donation details with correct structure', async () => {
    const detailedDonationData = {
      seekerId: 'test-seeker-id',
      requestPostId: 'test-request-post-id',
      createdAt: '2024-01-01T00:00:00.000Z',
      bloodType: 'O-',
      location: 'City Hospital',
      status: 'COMPLETED',
      donorCount: 3,
      acceptedDonors: ['donor1', 'donor2', 'donor3']
    }

    mockBloodDonationService.prototype.getDonationRequestDetails.mockResolvedValue(
      detailedDonationData
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        success: true,
        data: detailedDonationData,
        message: 'Donation completed and donation record added successfully'
      })
    })

    const result: APIGatewayProxyResult = await getDonationRequestLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({
        success: true,
        data: detailedDonationData,
        message: 'Donation completed and donation record added successfully'
      })
    })
  })
})
