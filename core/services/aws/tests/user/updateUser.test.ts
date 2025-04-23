import { UpdateUserAttributes } from '../../../../application/userWorkflow/Types'
import { UserService } from '../../../../application/userWorkflow/UserService'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { APIGatewayProxyResult } from 'aws-lambda'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import updateUserLambda from '../../user/updateUser'
import { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import { UPDATE_PROFILE_SUCCESS } from '../../../../../commons/libs/constants/ApiResponseMessages'
import { BloodGroup } from 'commons/dto/DonationDTO'
import { Gender } from 'commons/dto/UserDTO'
import { LocationService } from '../../../../application/userWorkflow/LocationService'

jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../../../application/userWorkflow/LocationService')
jest.mock('../../commons/ddbOperations/DynamoDbTableOperations')
jest.mock('../../commons/ddbOperations/LocationDynamoDbOperations')
jest.mock('../../commons/lambda/ApiGateway')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))
jest.mock('../../../../../commons/libs/config/config', () => {
  return {
    Config: jest.fn().mockImplementation(() => {
      return {
        getConfig: () => ({
          dynamodbTableName: 'test-table',
          awsRegion: 'us-east-1',
          minMonthsBetweenDonations: 4
        })
      }
    })
  }
})

describe('updateUserLambda', () => {
  const mockedGenerateApiGatewayResponse =
    generateApiGatewayResponse as jest.MockedFunction<typeof generateApiGatewayResponse>
  const mockedUserService = UserService as jest.MockedClass<typeof UserService>
  const minMonthsBetweenDonations = 4

  beforeEach(() => {
    mockedUserService.prototype.updateUser = jest.fn()
    mockedGenerateApiGatewayResponse.mockClear()
  })

  it('should return success response when updateUser is successful', async () => {
    const mockEvent: UpdateUserAttributes = {
      userId: '12345',
      dateOfBirth: '1990-01-01',
      phoneNumbers: ['1234567890'],
      bloodGroup: 'A+' as BloodGroup,
      lastDonationDate: '2023-08-01',
      height: '5.10',
      weight: 65,
      availableForDonation: true,
      gender: 'male' as Gender,
      NIDFront: 's3://bucket/nid/1a2b3c4d5e-front.jpg',
      NIDBack: 's3://bucket/nid/1a2b3c4d5e-back.jpg',
      lastVaccinatedDate: '2023-05-01',
      age: 34,
      preferredDonationLocations: []
    }

    const mockResponse = UPDATE_PROFILE_SUCCESS

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
      expect.any(LocationService),
      minMonthsBetweenDonations
    )
    expect(mockedGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { success: true, message: mockResponse },
      HTTP_CODES.OK
    )
    expect(result.statusCode).toBe(HTTP_CODES.OK)
    expect(result.body).toBe(JSON.stringify({ message: mockResponse }))
  })

  it('should return error response when updateUser throws an error', async () => {
    const mockEvent = {
      userId: '12345',
      dateOfBirth: '1990-01-01',
      phoneNumbers: ['1234567890'],
      bloodGroup: 'A+',
      lastDonationDate: '2023-08-01',
      height: '5.10',
      weight: 65,
      availableForDonation: true,
      gender: 'male',
      NIDFront: 's3://bucket/nid/1a2b3c4d5e-front.jpg',
      NIDBack: 's3://bucket/nid/1a2b3c4d5e-back.jpg',
      lastVaccinatedDate: '2023-05-01',
      age: 34,
      preferredDonationLocations: []
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
      expect.any(LocationService),
      minMonthsBetweenDonations
    )
    expect(mockedGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${mockError.message}`,
      HTTP_CODES.ERROR
    )
    expect(result.statusCode).toBe(HTTP_CODES.ERROR)
    expect(result.body).toBe(`Error: ${mockError.message}`)
  })

  it('should return error response when updateUser throws an error', async () => {
    const mockEvent = {
      userId: '12345',
      dateOfBirth: '1990-01-01',
      phoneNumbers: ['1234567890'],
      bloodGroup: 'A+',
      lastDonationDate: '2023-08-01',
      height: '5.10',
      weight: 65,
      availableForDonation: true,
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
      expect.any(LocationService),
      minMonthsBetweenDonations
    )
    expect(mockedGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${mockError.message}`,
      HTTP_CODES.ERROR
    )
    expect(result.statusCode).toBe(HTTP_CODES.ERROR)
    expect(result.body).toBe(`Error: ${mockError.message}`)
  })
})
