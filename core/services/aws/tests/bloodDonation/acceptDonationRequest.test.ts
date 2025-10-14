import type { APIGatewayProxyResult } from 'aws-lambda'
import acceptDonationRequestLambda from '../../bloodDonation/acceptDonationRequest'
import { AcceptDonationService } from '../../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import { NotificationService } from '../../../../application/notificationWorkflow/NotificationService'
import { UserService } from '../../../../application/userWorkflow/UserService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { AcceptDonationRequestAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'

jest.mock('../../../../application/bloodDonationWorkflow/AcceptDonationRequestService')
jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../../../application/notificationWorkflow/NotificationService')
jest.mock('../../../../application/userWorkflow/UserService')
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

const mockAcceptDonationService = AcceptDonationService as jest.MockedClass<
  typeof AcceptDonationService
>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('acceptDonationRequestLambda', () => {
  const mockEvent: AcceptDonationRequestAttributes & HttpLoggerAttributes = {
    donorId: 'test-donor-id',
    seekerId: 'test-seeker-id',
    requestPostId: 'test-request-post-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    status: 'ACCEPTED',
    apiGwRequestId: 'test-api-gw-request-id',
    cloudFrontRequestId: 'test-cloudfront-request-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully accept donation request and return success response', async () => {
    mockAcceptDonationService.prototype.acceptDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation request ACCEPTED successfully.' })
    })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation request ACCEPTED successfully.' })
    })
    expect(mockAcceptDonationService.prototype.acceptDonationRequest).toHaveBeenCalled()
    const callArgs = mockAcceptDonationService.prototype.acceptDonationRequest.mock.calls[0]
    expect(callArgs[0]).toBe('test-donor-id')
    expect(callArgs[1]).toBe('test-seeker-id')
    expect(callArgs[2]).toBe('test-request-post-id')
    expect(callArgs[3]).toBe('2024-01-01T00:00:00.000Z')
    expect(callArgs[4]).toBe('ACCEPTED')
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { message: 'Donation request ACCEPTED successfully.' },
      HTTP_CODES.OK
    )
  })

  it('should handle REJECTED status', async () => {
    const rejectEvent = { ...mockEvent, status: 'REJECTED' }
    mockAcceptDonationService.prototype.acceptDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation request REJECTED successfully.' })
    })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(rejectEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation request REJECTED successfully.' })
    })
    expect(mockAcceptDonationService.prototype.acceptDonationRequest).toHaveBeenCalled()
    const callArgs = mockAcceptDonationService.prototype.acceptDonationRequest.mock.calls[0]
    expect(callArgs[4]).toBe('REJECTED')
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { message: 'Donation request REJECTED successfully.' },
      HTTP_CODES.OK
    )
  })

  it('should return error response when standard Error is thrown', async () => {
    const errorMessage = 'Database connection failed'
    mockAcceptDonationService.prototype.acceptDonationRequest.mockRejectedValue(
      new Error(errorMessage)
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.ERROR
    )
  })

  it('should handle non-Error objects with default error message', async () => {
    const nonErrorObject = { random: 'error' }
    mockAcceptDonationService.prototype.acceptDonationRequest.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${UNKNOWN_ERROR_MESSAGE}`
    })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(mockEvent)

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
    const complexEvent: AcceptDonationRequestAttributes & HttpLoggerAttributes = {
      donorId: 'complex-donor-id-with-dashes',
      seekerId: 'complex-seeker-id-with-dashes',
      requestPostId: 'complex-request-post-id-with-dashes',
      createdAt: '2024-12-31T23:59:59.999Z',
      status: 'ACCEPTED',
      apiGwRequestId: 'complex-api-gw-request-id',
      cloudFrontRequestId: 'complex-cloudfront-request-id'
    }

    mockAcceptDonationService.prototype.acceptDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation request ACCEPTED successfully.' })
    })

    await acceptDonationRequestLambda(complexEvent)

    expect(mockAcceptDonationService.prototype.acceptDonationRequest).toHaveBeenCalled()
    const callArgs = mockAcceptDonationService.prototype.acceptDonationRequest.mock.calls[0]
    expect(callArgs[0]).toBe('complex-donor-id-with-dashes')
    expect(callArgs[1]).toBe('complex-seeker-id-with-dashes')
    expect(callArgs[2]).toBe('complex-request-post-id-with-dashes')
    expect(callArgs[3]).toBe('2024-12-31T23:59:59.999Z')
    expect(callArgs[4]).toBe('ACCEPTED')
  })

  it('should create services with correct dependencies', async () => {
    mockAcceptDonationService.prototype.acceptDonationRequest.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: 'Donation request ACCEPTED successfully.' })
    })

    await acceptDonationRequestLambda(mockEvent)

    expect(AcceptDonationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(BloodDonationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(NotificationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(UserService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
  })

  it('should handle validation errors gracefully', async () => {
    const validationError = new Error('Invalid donation status')
    mockAcceptDonationService.prototype.acceptDonationRequest.mockRejectedValue(validationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: 'Error: Invalid donation status'
    })

    const result: APIGatewayProxyResult = await acceptDonationRequestLambda(mockEvent)

    expect(result.statusCode).toBe(HTTP_CODES.ERROR)
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      'Error: Invalid donation status',
      HTTP_CODES.ERROR
    )
  })
})
