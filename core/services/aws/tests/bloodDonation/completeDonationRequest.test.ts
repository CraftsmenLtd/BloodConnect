import type { APIGatewayProxyResult } from 'aws-lambda'
import completeDonationRequest from '../../bloodDonation/completeDonationRequest'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import { DonationRecordService } from '../../../../application/bloodDonationWorkflow/DonationRecordService'
import { NotificationService } from '../../../../application/notificationWorkflow/NotificationService'
import { UserService } from '../../../../application/userWorkflow/UserService'
import { LocationService } from '../../../../application/userWorkflow/LocationService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { DonationRecordEventAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import DonationRecordOperationError from '../../../../application/bloodDonationWorkflow/DonationRecordOperationError'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'
import SQSOperations from '../../commons/sqs/SQSOperations'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../../../application/bloodDonationWorkflow/DonationRecordService')
jest.mock('../../../../application/notificationWorkflow/NotificationService')
jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../../../application/userWorkflow/LocationService')
jest.mock('../../commons/sqs/SQSOperations')
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
const mockDonationRecordService = DonationRecordService as jest.MockedClass<
  typeof DonationRecordService
>
const mockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>
const mockUserService = UserService as jest.MockedClass<typeof UserService>
const mockLocationService = LocationService as jest.MockedClass<typeof LocationService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('completeDonationRequest', () => {
  const mockEvent: DonationRecordEventAttributes & HttpLoggerAttributes = {
    seekerId: 'test-seeker-id',
    requestPostId: 'test-request-post-id',
    requestCreatedAt: '2024-01-01T00:00:00.000Z',
    donorIds: ['donor-1', 'donor-2'],
    apiGwRequestId: 'test-api-gw-request-id',
    cloudFrontRequestId: 'test-cloudfront-request-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully complete donation request and return success response', async () => {
    mockBloodDonationService.prototype.completeDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation completed and donation record added successfully' })
    })

    const result: APIGatewayProxyResult = await completeDonationRequest(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation completed and donation record added successfully' })
    })
    expect(mockBloodDonationService.prototype.completeDonationRequest).toHaveBeenCalled()
    const callArgs = mockBloodDonationService.prototype.completeDonationRequest.mock.calls[0]
    expect(callArgs[0]).toBe('test-seeker-id')
    expect(callArgs[1]).toBe('test-request-post-id')
    expect(callArgs[2]).toBe('2024-01-01T00:00:00.000Z')
    expect(callArgs[3]).toEqual(['donor-1', 'donor-2'])
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { message: 'Donation completed and donation record added successfully' },
      HTTP_CODES.OK
    )
  })

  it('should handle single donor in donorIds array', async () => {
    const singleDonorEvent = { ...mockEvent, donorIds: ['single-donor'] }
    mockBloodDonationService.prototype.completeDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation completed and donation record added successfully' })
    })

    await completeDonationRequest(singleDonorEvent)

    expect(mockBloodDonationService.prototype.completeDonationRequest).toHaveBeenCalled()
    const callArgs = mockBloodDonationService.prototype.completeDonationRequest.mock.calls[0]
    expect(callArgs[0]).toBe('test-seeker-id')
    expect(callArgs[1]).toBe('test-request-post-id')
    expect(callArgs[2]).toBe('2024-01-01T00:00:00.000Z')
    expect(callArgs[3]).toEqual(['single-donor'])
  })

  it('should handle multiple donors in donorIds array', async () => {
    const multipleDonorsEvent = {
      ...mockEvent,
      donorIds: ['donor-1', 'donor-2', 'donor-3', 'donor-4']
    }
    mockBloodDonationService.prototype.completeDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation completed and donation record added successfully' })
    })

    await completeDonationRequest(multipleDonorsEvent)

    expect(mockBloodDonationService.prototype.completeDonationRequest).toHaveBeenCalled()
    const callArgs = mockBloodDonationService.prototype.completeDonationRequest.mock.calls[0]
    expect(callArgs[0]).toBe('test-seeker-id')
    expect(callArgs[1]).toBe('test-request-post-id')
    expect(callArgs[2]).toBe('2024-01-01T00:00:00.000Z')
    expect(callArgs[3]).toEqual(['donor-1', 'donor-2', 'donor-3', 'donor-4'])
  })

  it('should return error response when standard Error is thrown', async () => {
    const errorMessage = 'Database connection failed'
    mockBloodDonationService.prototype.completeDonationRequest.mockRejectedValue(
      new Error(errorMessage)
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await completeDonationRequest(mockEvent)

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
    const errorMessage = 'Donation record creation failed'
    const customErrorCode = HTTP_CODES.CONFLICT
    const operationError = new DonationRecordOperationError(errorMessage, customErrorCode)

    mockBloodDonationService.prototype.completeDonationRequest.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: customErrorCode,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await completeDonationRequest(mockEvent)

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
    mockBloodDonationService.prototype.completeDonationRequest.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${UNKNOWN_ERROR_MESSAGE}`
    })

    const result: APIGatewayProxyResult = await completeDonationRequest(mockEvent)

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
      donorIds: ['complex-donor-1', 'complex-donor-2', 'complex-donor-3'],
      apiGwRequestId: 'complex-api-gw-request-id',
      cloudFrontRequestId: 'complex-cloudfront-request-id'
    }

    mockBloodDonationService.prototype.completeDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation completed and donation record added successfully' })
    })

    await completeDonationRequest(complexEvent)

    expect(mockBloodDonationService.prototype.completeDonationRequest).toHaveBeenCalled()
    const callArgs = mockBloodDonationService.prototype.completeDonationRequest.mock.calls[0]
    expect(callArgs[0]).toBe('complex-seeker-id-with-dashes')
    expect(callArgs[1]).toBe('complex-request-post-id-with-dashes')
    expect(callArgs[2]).toBe('2024-12-31T23:59:59.999Z')
    expect(callArgs[3]).toEqual(['complex-donor-1', 'complex-donor-2', 'complex-donor-3'])
  })

  it('should create all required services with correct dependencies', async () => {
    mockBloodDonationService.prototype.completeDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation completed and donation record added successfully' })
    })

    await completeDonationRequest(mockEvent)

    expect(BloodDonationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(NotificationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(UserService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(DonationRecordService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(LocationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
  })

  it('should handle DonationRecordOperationError with NOT_FOUND code', async () => {
    const errorMessage = 'Donation request not found'
    const operationError = new DonationRecordOperationError(errorMessage, HTTP_CODES.NOT_FOUND)

    mockBloodDonationService.prototype.completeDonationRequest.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.NOT_FOUND,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await completeDonationRequest(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.NOT_FOUND,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.NOT_FOUND
    )
  })

  it('should handle empty donorIds array', async () => {
    const emptyDonorsEvent = { ...mockEvent, donorIds: [] }
    mockBloodDonationService.prototype.completeDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation completed and donation record added successfully' })
    })

    await completeDonationRequest(emptyDonorsEvent)

    expect(mockBloodDonationService.prototype.completeDonationRequest).toHaveBeenCalled()
    const callArgs = mockBloodDonationService.prototype.completeDonationRequest.mock.calls[0]
    expect(callArgs[0]).toBe('test-seeker-id')
    expect(callArgs[1]).toBe('test-request-post-id')
    expect(callArgs[2]).toBe('2024-01-01T00:00:00.000Z')
    expect(callArgs[3]).toEqual([])
  })
})
