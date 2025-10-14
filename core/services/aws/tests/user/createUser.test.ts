import type { APIGatewayProxyResult } from 'aws-lambda'
import createUserLambda from '../../user/createUser'
import { UserService } from '../../../../application/userWorkflow/UserService'
import { LocationService } from '../../../../application/userWorkflow/LocationService'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { CreateUserAttributes } from '../../../../application/userWorkflow/Types'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import {
  CREATE_PROFILE_SUCCESS,
  UNKNOWN_ERROR_MESSAGE
} from '../../../../../commons/libs/constants/ApiResponseMessages'

jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../../../application/userWorkflow/LocationService')
jest.mock('../../commons/lambda/ApiGateway')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockUserService = UserService as jest.MockedClass<typeof UserService>
const mockLocationService = LocationService as jest.MockedClass<typeof LocationService>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('createUserLambda', () => {
  const mockEvent: CreateUserAttributes & HttpLoggerAttributes = {
    userId: 'test-user-id',
    bloodGroup: 'A+',
    gender: 'Male',
    countryCode: '+880',
    dateOfBirth: '1990-01-01',
    age: 33,
    preferredDonationLocations: ['City Hospital', 'General Hospital'],
    availableForDonation: true,
    apiGwRequestId: 'test-api-gw-request-id',
    cloudFrontRequestId: 'test-cloudfront-request-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully create user and return success response', async () => {
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    const result: APIGatewayProxyResult = await createUserLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })
    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user-id',
        bloodGroup: 'A+',
        gender: 'Male',
        countryCode: '+880',
        dateOfBirth: '1990-01-01',
        age: 33,
        preferredDonationLocations: ['City Hospital', 'General Hospital'],
        availableForDonation: true
      }),
      expect.any(Object),
      expect.any(Number)
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { message: CREATE_PROFILE_SUCCESS, success: true },
      HTTP_CODES.CREATED
    )
  })

  it('should handle availableForDonation as string "true"', async () => {
    const eventWithStringBool = { ...mockEvent, availableForDonation: 'true' as any }
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(eventWithStringBool)

    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        availableForDonation: true
      }),
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should handle availableForDonation as false', async () => {
    const eventWithFalse = { ...mockEvent, availableForDonation: false }
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(eventWithFalse)

    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        availableForDonation: false
      }),
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should include optional phoneNumbers when provided', async () => {
    const eventWithPhoneNumbers = {
      ...mockEvent,
      phoneNumbers: ['+8801234567890', '+8809876543210']
    }
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(eventWithPhoneNumbers)

    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumbers: ['+8801234567890', '+8809876543210']
      }),
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should include optional height and weight when provided', async () => {
    const eventWithMeasurements = {
      ...mockEvent,
      height: 175,
      weight: 70
    }
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(eventWithMeasurements)

    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        height: 175,
        weight: 70
      }),
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should include optional lastDonationDate when provided', async () => {
    const eventWithLastDonation = {
      ...mockEvent,
      lastDonationDate: '2024-01-01'
    }
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(eventWithLastDonation)

    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        lastDonationDate: '2024-01-01'
      }),
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should include optional lastVaccinatedDate when provided', async () => {
    const eventWithVaccination = {
      ...mockEvent,
      lastVaccinatedDate: '2024-06-01'
    }
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(eventWithVaccination)

    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        lastVaccinatedDate: '2024-06-01'
      }),
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should include optional NID images when provided', async () => {
    const eventWithNID = {
      ...mockEvent,
      NIDFront: 'https://example.com/nid-front.jpg',
      NIDBack: 'https://example.com/nid-back.jpg'
    }
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(eventWithNID)

    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        NIDFront: 'https://example.com/nid-front.jpg',
        NIDBack: 'https://example.com/nid-back.jpg'
      }),
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should not include optional fields when they are undefined', async () => {
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(mockEvent)

    const callArgs = mockUserService.prototype.createUser.mock.calls[0][0]
    expect(callArgs).not.toHaveProperty('phoneNumbers')
    expect(callArgs).not.toHaveProperty('height')
    expect(callArgs).not.toHaveProperty('weight')
    expect(callArgs).not.toHaveProperty('lastDonationDate')
    expect(callArgs).not.toHaveProperty('lastVaccinatedDate')
    expect(callArgs).not.toHaveProperty('NIDFront')
    expect(callArgs).not.toHaveProperty('NIDBack')
  })

  it('should return error response when standard Error is thrown', async () => {
    const errorMessage = 'Database connection failed'
    mockUserService.prototype.createUser.mockRejectedValue(new Error(errorMessage))
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${errorMessage}`
    })

    const result: APIGatewayProxyResult = await createUserLambda(mockEvent)

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
    mockUserService.prototype.createUser.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${UNKNOWN_ERROR_MESSAGE}`
    })

    const result: APIGatewayProxyResult = await createUserLambda(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.ERROR,
      body: `Error: ${UNKNOWN_ERROR_MESSAGE}`
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      `Error: ${UNKNOWN_ERROR_MESSAGE}`,
      HTTP_CODES.ERROR
    )
  })

  it('should create services with correct dependencies', async () => {
    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(mockEvent)

    expect(UserService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(LocationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
  })

  it('should handle complex user attributes with all optional fields', async () => {
    const complexEvent: CreateUserAttributes & HttpLoggerAttributes = {
      userId: 'complex-user-id',
      bloodGroup: 'O-',
      gender: 'Female',
      countryCode: '+1',
      dateOfBirth: '1995-05-15',
      age: 28,
      preferredDonationLocations: ['Hospital A', 'Hospital B', 'Hospital C'],
      availableForDonation: true,
      phoneNumbers: ['+1234567890'],
      height: 165,
      weight: 55,
      lastDonationDate: '2023-12-01',
      lastVaccinatedDate: '2024-03-15',
      NIDFront: 'https://cdn.example.com/nid-front.png',
      NIDBack: 'https://cdn.example.com/nid-back.png',
      apiGwRequestId: 'complex-api-gw-request-id',
      cloudFrontRequestId: 'complex-cloudfront-request-id'
    }

    mockUserService.prototype.createUser.mockResolvedValue(undefined)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.CREATED,
      body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
    })

    await createUserLambda(complexEvent)

    expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'complex-user-id',
        bloodGroup: 'O-',
        gender: 'Female',
        countryCode: '+1',
        dateOfBirth: '1995-05-15',
        age: 28,
        preferredDonationLocations: ['Hospital A', 'Hospital B', 'Hospital C'],
        availableForDonation: true,
        phoneNumbers: ['+1234567890'],
        height: 165,
        weight: 55,
        lastDonationDate: '2023-12-01',
        lastVaccinatedDate: '2024-03-15',
        NIDFront: 'https://cdn.example.com/nid-front.png',
        NIDBack: 'https://cdn.example.com/nid-back.png'
      }),
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should handle different blood groups correctly', async () => {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

    for (const bloodGroup of bloodGroups) {
      const eventWithBloodGroup = { ...mockEvent, bloodGroup }
      mockUserService.prototype.createUser.mockResolvedValue(undefined)
      mockGenerateApiGatewayResponse.mockReturnValue({
        statusCode: HTTP_CODES.CREATED,
        body: JSON.stringify({ message: CREATE_PROFILE_SUCCESS, success: true })
      })

      await createUserLambda(eventWithBloodGroup)

      expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          bloodGroup
        }),
        expect.any(Object),
        expect.any(Number)
      )

      jest.clearAllMocks()
    }
  })
})
