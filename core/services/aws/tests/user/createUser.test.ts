import type { CreateUserAttributes } from '../../../../application/userWorkflow/Types'
import { UserService } from '../../../../application/userWorkflow/UserService'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import createUserLambda from '../../user/createUser'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import { CREATE_PROFILE_SUCCESS } from '../../../../../commons/libs/constants/ApiResponseMessages'
import type { BloodGroup } from 'commons/dto/DonationDTO'
import type { Gender } from 'commons/dto/UserDTO'

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
jest.mock('../../../../../commons/libs/config/config', () => ({
  Config: jest.fn().mockImplementation(() => ({
    getConfig: () => ({
      dynamodbTableName: 'test-table',
      awsRegion: 'us-east-1',
      minMonthsBetweenDonations: 4
    })
  }))
}))

describe('createUserLambda profilePicture handling', () => {
  const mockedGenerateApiGatewayResponse
    = generateApiGatewayResponse as jest.MockedFunction<typeof generateApiGatewayResponse>
  const mockedUserService = UserService as jest.MockedClass<typeof UserService>

  const baseEvent = {
    userId: '12345',
    countryCode: 'BD',
    bloodGroup: 'A+' as BloodGroup,
    gender: 'male' as Gender,
    dateOfBirth: '1990-01-01',
    age: 34,
    availableForDonation: true,
    preferredDonationLocations: []
  }

  beforeEach(() => {
    mockedUserService.prototype.createUser = jest.fn()
    mockedGenerateApiGatewayResponse.mockClear()
    mockedGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS })
    })
  })

  test('should persist the identity provider picture when signup supplies one', async() => {
    await createUserLambda({
      ...baseEvent,
      profilePicture: 'https://lh3.googleusercontent.com/a/photo.jpg'
    } as CreateUserAttributes & HttpLoggerAttributes)

    const passedAttributes = mockedUserService.prototype.createUser.mock.calls[0][0]
    expect(passedAttributes.profilePicture).toBe(
      'https://lh3.googleusercontent.com/a/photo.jpg'
    )
    expect(passedAttributes.profilePictureSource).toBe('provider')
  })

  test('should ignore a profilePictureSource supplied by the client', async() => {
    await createUserLambda({
      ...baseEvent,
      profilePicture: 'https://lh3.googleusercontent.com/a/photo.jpg',
      profilePictureSource: 'upload'
    } as CreateUserAttributes & HttpLoggerAttributes)

    const passedAttributes = mockedUserService.prototype.createUser.mock.calls[0][0]
    expect(passedAttributes.profilePictureSource).toBe('provider')
  })

  test('should omit profilePicture when signup supplies none', async() => {
    await createUserLambda(baseEvent as CreateUserAttributes & HttpLoggerAttributes)

    const passedAttributes = mockedUserService.prototype.createUser.mock.calls[0][0]
    expect('profilePicture' in passedAttributes).toBe(false)
  })

  test('should omit profilePicture when the supplied value is empty', async() => {
    await createUserLambda({
      ...baseEvent,
      profilePicture: ''
    } as CreateUserAttributes & HttpLoggerAttributes)

    const passedAttributes = mockedUserService.prototype.createUser.mock.calls[0][0]
    expect('profilePicture' in passedAttributes).toBe(false)
  })
})
