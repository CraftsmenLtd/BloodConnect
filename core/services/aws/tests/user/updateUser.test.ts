import LocationModel from '../../../../application/models/dbModels/LocationModel'
import { UpdateUserAttributes } from '../../../../application/userWorkflow/Types'
import { UserService } from '../../../../application/userWorkflow/UserService'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { APIGatewayProxyResult } from 'aws-lambda'
import DynamoDbTableOperations from '../../commons/ddb/DynamoDbTableOperations'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import updateUserLambda from '../../user/updateUser'
import { HttpLoggerAttributes } from '../../commons/httpLogger/HttpLogger'

jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../commons/ddb/DynamoDbTableOperations')
jest.mock('../../commons/lambda/ApiGateway')
jest.mock('../../commons/httpLogger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

describe('updateUserLambda', () => {
  const mockedGenerateApiGatewayResponse =
    generateApiGatewayResponse as jest.MockedFunction<
      typeof generateApiGatewayResponse
    >
  const mockedUserService = UserService as jest.MockedClass<typeof UserService>

  beforeEach(() => {
    mockedUserService.prototype.updateUser = jest.fn()
    mockedGenerateApiGatewayResponse.mockClear()
  })

  it('should return success response when updateUser is successful', async() => {
    const mockEvent = {
      userId: '12345',
      name: 'Updated Ebrahim',
      dateOfBirth: '1990-01-01',
      phoneNumbers: ['1234567890'],
      bloodGroup: 'A+',
      lastDonationDate: '2023-08-01',
      height: 170,
      weight: 65,
      availableForDonation: 'yes',
      gender: 'male',
      NIDFront: 's3://bucket/nid/1a2b3c4d5e-front.jpg',
      NIDBack: 's3://bucket/nid/1a2b3c4d5e-back.jpg',
      lastVaccinatedDate: '2023-05-01'
    }

    const mockResponse = 'User updated successfully'
    mockedUserService.prototype.updateUser.mockResolvedValue()
    mockedGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: mockResponse })
    })

    const result: APIGatewayProxyResult = await updateUserLambda(
      mockEvent as UpdateUserAttributes & HttpLoggerAttributes
    )

    expect(mockedUserService.prototype.updateUser).toHaveBeenCalledWith(
      expect.objectContaining(mockEvent),
      expect.any(DynamoDbTableOperations),
      expect.any(DynamoDbTableOperations),
      expect.any(LocationModel)
    )
    expect(mockedGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { message: mockResponse },
      HTTP_CODES.OK
    )
    expect(result.statusCode).toBe(HTTP_CODES.OK)
    expect(result.body).toBe(JSON.stringify({ message: mockResponse }))
  })

  it('should return error response when updateUser throws an error', async() => {
    const mockEvent = {
      userId: '12345',
      name: 'Updated Ebrahim',
      dateOfBirth: '1990-01-01',
      phoneNumbers: ['1234567890'],
      bloodGroup: 'A+',
      lastDonationDate: '2023-08-01',
      height: 170,
      weight: 65,
      availableForDonation: 'yes',
      gender: 'male',
      NIDFront: 's3://bucket/nid/1a2b3c4d5e-front.jpg',
      NIDBack: 's3://bucket/nid/1a2b3c4d5e-back.jpg',
      lastVaccinatedDate: '2023-05-01'
    }
    const mockError = new Error('Failed to update user')

    mockedUserService.prototype.updateUser.mockRejectedValue(mockError)
    mockedGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${mockError.message}`
    })

    const result: APIGatewayProxyResult = await updateUserLambda(
      mockEvent as UpdateUserAttributes & HttpLoggerAttributes
    )

    expect(mockedUserService.prototype.updateUser).toHaveBeenCalledWith(
      expect.objectContaining(mockEvent),
      expect.any(DynamoDbTableOperations),
      expect.any(DynamoDbTableOperations),
      expect.any(LocationModel)
    )
    expect(mockedGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${mockError.message}`,
      HTTP_CODES.ERROR
    )
    expect(result.statusCode).toBe(HTTP_CODES.ERROR)
    expect(result.body).toBe(`Error: ${mockError.message}`)
  })

  it('should filter out undefined and empty fields from event', async() => {
    const mockEvent = {
      userId: 'user123',
      email: 'test@example.com',
      phoneNumber: '',
      address: undefined
    }

    const mockResponse = 'User updated successfully'
    mockedUserService.prototype.updateUser.mockResolvedValue()
    mockedGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ message: mockResponse })
    })

    const result: APIGatewayProxyResult = await updateUserLambda(
      mockEvent as unknown as UpdateUserAttributes & HttpLoggerAttributes
    )

    expect(mockedUserService.prototype.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user123', email: 'test@example.com' }),
      expect.any(DynamoDbTableOperations),
      expect.any(DynamoDbTableOperations),
      expect.any(LocationModel)
    )
    expect(mockedGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { message: mockResponse },
      HTTP_CODES.OK
    )
    expect(result.statusCode).toBe(HTTP_CODES.OK)
    expect(result.body).toBe(JSON.stringify({ message: mockResponse }))
  })
})
