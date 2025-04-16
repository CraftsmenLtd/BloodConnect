import { APIGatewayProxyResult } from 'aws-lambda'
import createBloodDonationLambda from '../../bloodDonation/createBloodDonation'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import {
  BloodDonationAttributes,
  BloodDonationEventAttributes
} from '../../../../application/bloodDonationWorkflow/Types'
import { donationAttributesMock } from '../../../../application/tests/mocks/mockDonationRequestData'
import BloodDonationOperationError from '../../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import { CREATE_DONATION_REQUEST_SUCCESS } from '../../../../../commons/libs/constants/ApiResponseMessages'
import { UserService } from '../../../../application/userWorkflow/UserService'
import { mockUserDetailsWithStringId } from '../../../../application/tests/mocks/mockUserData'
import BloodDonationDynamoDbOperations from '../../commons/ddbOperations/BloodDonationDynamoDbOperations'
import { BloodDonationModel } from '../../commons/ddbModels/BloodDonationModel'
import DynamoDbTableOperations from '../../commons/ddbOperations/DynamoDbTableOperations'
import { mockServiceLogger } from '../mock/loggerMock'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../../../application/userWorkflow/UserService')
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
const mockUserService = UserService as jest.MockedClass<typeof UserService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('createBloodDonationLambda', () => {
  const { shortDescription, countryCode, seekerName, ...rest } = donationAttributesMock
  const mockEvent: BloodDonationEventAttributes = { ...rest }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return a successful response when blood donation is created', async () => {
    const mockResponse = CREATE_DONATION_REQUEST_SUCCESS

    mockUserService.prototype.getUser.mockResolvedValue(mockUserDetailsWithStringId)

    mockBloodDonationService.prototype.createBloodDonation.mockResolvedValue({
      requestPostId: expect.any(String),
      createdAt: expect.any(String)
    })
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: mockResponse })
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(
      mockEvent as BloodDonationAttributes & HttpLoggerAttributes
    )

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: mockResponse })
    })
    expect(mockBloodDonationService.prototype.createBloodDonation).toHaveBeenCalledWith(
      mockEvent,
      expect.any(BloodDonationDynamoDbOperations),
      expect.any(BloodDonationModel),
      expect.any(UserService),
      expect.any(DynamoDbTableOperations),
      mockServiceLogger
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      {
        success: true,
        data: {
          createdAt: expect.any(String),
          requestPostId: expect.any(String)
        },
        message: mockResponse
      },
      HTTP_CODES.CREATED
    )
  })

  it('should return an error response when a standard Error is thrown', async () => {
    const errorMessage = 'Database connection failed'
    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(
      new Error(errorMessage)
    )
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(
      mockEvent as BloodDonationAttributes & HttpLoggerAttributes
    )

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
    const errorMessage = 'Operation failed'
    const customErrorCode = HTTP_CODES.NOT_FOUND
    const operationError = new BloodDonationOperationError(errorMessage, customErrorCode)

    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: customErrorCode,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(
      mockEvent as BloodDonationAttributes & HttpLoggerAttributes
    )

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
    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: 'Error: An unknown error occurred'
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(
      mockEvent as BloodDonationAttributes & HttpLoggerAttributes
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

  it('should handle BloodDonationOperationError with TOO_MANY_REQUESTS code', async () => {
    const errorMessage = 'Rate limit exceeded'
    const operationError = new BloodDonationOperationError(
      errorMessage,
      HTTP_CODES.TOO_MANY_REQUESTS
    )

    mockBloodDonationService.prototype.createBloodDonation.mockRejectedValue(operationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.TOO_MANY_REQUESTS,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await createBloodDonationLambda(
      mockEvent as BloodDonationAttributes & HttpLoggerAttributes
    )

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
