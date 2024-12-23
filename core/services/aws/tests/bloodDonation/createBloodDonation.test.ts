import { APIGatewayProxyResult } from 'aws-lambda'
import createBloodDonationLambda from '../../bloodDonation/createBloodDonation'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { BloodDonationAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import { donationAttributesMock } from '../../../../application/tests/mocks/mockDonationRequestData'
import BloodDonationOperationError from '../../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import { HttpLoggerAttributes } from '../../commons/httpLogger/HttpLogger'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../commons/lambda/ApiGateway')
jest.mock('../../commons/httpLogger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockBloodDonationService = BloodDonationService as jest.MockedClass<typeof BloodDonationService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('createBloodDonationLambda', () => {
  const { shortDescription, ...rest } = donationAttributesMock
  const mockEvent: BloodDonationAttributes = { ...rest }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return a successful response when blood donation is created', async() => {
    const mockResponse = 'We have accepted your request, and we will let you know when we find a donor.'

    mockBloodDonationService.prototype.createBloodDonation.mockResolvedValue({
      requestPostId: expect.any(String),
      createdAt: expect.any(String)
    })
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: mockResponse })
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(mockEvent as BloodDonationAttributes & HttpLoggerAttributes)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: mockResponse })
    })
    expect(mockBloodDonationService.prototype.createBloodDonation).toHaveBeenCalledWith(
      { ...mockEvent },
      expect.anything(),
      expect.any(Object)
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      {
        data: {
          createdAt: expect.any(String),
          requestPostId: expect.any(String)
        },
        message: mockResponse
      },
      HTTP_CODES.OK
    )
  })

  it('should return an error response when a standard Error is thrown', async() => {
    const errorMessage = 'Database connection failed'
    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(new Error(errorMessage))
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(mockEvent as BloodDonationAttributes & HttpLoggerAttributes)

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.ERROR
    )
  })

  it('should handle BloodDonationOperationError with custom error code', async() => {
    const errorMessage = 'Operation failed'
    const customErrorCode = HTTP_CODES.NOT_FOUND
    const operationError = new BloodDonationOperationError(errorMessage, customErrorCode)

    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: customErrorCode,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(mockEvent as BloodDonationAttributes & HttpLoggerAttributes)

    expect(result).toEqual({
      statusCode: customErrorCode,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      customErrorCode
    )
  })

  it('should handle non-Error objects with default error message', async() => {
    const nonErrorObject = { random: 'error' }
    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: 'Error: An unknown error occurred'
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(mockEvent as BloodDonationAttributes & HttpLoggerAttributes)

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: 'Error: An unknown error occurred'
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      'Error: An unknown error occurred',
      HTTP_CODES.ERROR
    )
  })

  it('should handle BloodDonationOperationError with TOO_MANY_REQUESTS code', async() => {
    const errorMessage = 'Rate limit exceeded'
    const operationError = new BloodDonationOperationError(errorMessage, HTTP_CODES.TOO_MANY_REQUESTS)

    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.TOO_MANY_REQUESTS,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(mockEvent as BloodDonationAttributes & HttpLoggerAttributes)

    expect(result).toEqual({
      statusCode: HTTP_CODES.TOO_MANY_REQUESTS,
      body: `Error: ${errorMessage}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${errorMessage}`,
      HTTP_CODES.TOO_MANY_REQUESTS
    )
  })
})
