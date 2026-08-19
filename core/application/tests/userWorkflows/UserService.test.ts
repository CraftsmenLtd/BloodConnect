import { UserService } from '../../userWorkflow/UserService'
import { generateUniqueID } from '../../utils/idGenerator'
import {
  getEmailVerificationMessage,
  getPasswordResetVerificationMessage,
  getAppUserWelcomeMailMessage
} from '../../userWorkflow/userMessages'
import { mockUserWithStringId } from '../mocks/mockUserData'
import { mockRepository } from '../mocks/mockRepositories'
import type Repository from '../../models/policies/repositories/Repository'
import type {
  UserDTO,
} from '../../../../commons/dto/UserDTO'
import type { UpdateUserAttributes } from '../../userWorkflow/Types'
import { mockLogger } from '../mocks/mockLogger'
import type { LocationService } from '../../userWorkflow/LocationService'
import { ISO_TIMESTAMP_REGEX } from '../../../../commons/libs/constants/Patterns'

jest.mock('../../utils/idGenerator')
jest.mock('../../userWorkflow/userMessages')
jest.mock('../../userWorkflow/LocationService')
const userMockRepository = {
  ...mockRepository,
  queryUserLocations: jest.fn(),
  deleteUserLocations: jest.fn(),
  getUser: jest.fn()
}
describe('UserService Tests', () => {
  const userService = new UserService(userMockRepository, mockLogger)
  const userRepository = mockRepository as jest.Mocked<Repository<UserDTO>>
  const minMonthsBetweenDonations = 4

  const mockUserAttributes = {
    email: 'ebrahim@example.com',
    name: 'Ebrahim',
    phoneNumbers: ['+8801834567890', '+8801755567822'],
    createdAt: '2023-09-16T12:00:00.000Z'
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (generateUniqueID as jest.Mock).mockReturnValue('12345')
    userRepository.query.mockResolvedValue({
      items: [],
      lastEvaluatedKey: undefined
    })
  })

  test('should create a new user successfully', async() => {
    userRepository.create.mockResolvedValue(mockUserWithStringId)
    const result = await userService.createNewUser(
      mockUserAttributes,
      userRepository
    )

    expect(result).toBe(mockUserWithStringId)
    expect(generateUniqueID).toHaveBeenCalledTimes(1)
    expect(userRepository.create).toHaveBeenCalledWith({
      ...mockUserWithStringId
    })
  })

  test('should throw an error on failure', async() => {
    const errorMessage = 'Database error'
    const originalError = new Error(errorMessage)

    mockRepository.create.mockRejectedValue(originalError)
    await expect(
      userService.createNewUser(mockUserAttributes, mockRepository)
    ).rejects.toThrow(new Error('Failed to create new user. Error: Database error'))
    expect(mockRepository.create).toHaveBeenCalledTimes(1)
  })

  test('should get post-signup message correctly', () => {
    const mockMessage = {
      title: 'Welcome to Blood Connect!',
      content: 'Verify your email'
    };
    (getEmailVerificationMessage as jest.Mock).mockReturnValue(mockMessage)

    const result = userService.getPostSignUpMessage('Ebrahim', '1234')
    expect(getEmailVerificationMessage).toHaveBeenCalledWith('Ebrahim', '1234')
    expect(result).toEqual(mockMessage)
  })

  test('should get forgot password message correctly', () => {
    const mockMessage = {
      body: 'Reset your password for Blood Connect',
      subject: 'Reset your password'
    };
    (getPasswordResetVerificationMessage as jest.Mock).mockReturnValue(
      mockMessage
    )

    const result = userService.getForgotPasswordMessage('Ebrahim', '1234')
    expect(getPasswordResetVerificationMessage).toHaveBeenCalledWith(
      'Ebrahim',
      '1234'
    )
    expect(result).toEqual(mockMessage)
  })
  test('should update user successfully', async() => {
    const mockUpdateAttributes = {
      userId: '12345',
      name: 'Updated Ebrahim',
      dateOfBirth: '1990-01-01',
      phoneNumbers: ['1234567890'],
      bloodGroup: 'A+',
      lastDonationDate: '2023-06-01',
      height: '5.10',
      weight: 65,
      availableForDonation: true,
      gender: 'male',
      NIDFront: 's3://bucket/nid/1a2b3c4d5e-front.jpg',
      NIDBack: 's3://bucket/nid/1a2b3c4d5e-back.jpg',
      lastVaccinatedDate: '2023-05-01',
      preferredDonationLocations: ['location-1', 'location-2']
    }

    const { userId, preferredDonationLocations, ...expectedUserData } = mockUpdateAttributes
    const mockUpdatedUserData = {
      id: userId,
      ...expectedUserData,
      countryCode: 'BD',
      age: 34,
      updatedAt: new Date().toISOString()
    }
    userService.getUser = jest.fn().mockResolvedValue(mockUpdatedUserData)
    userRepository.update.mockResolvedValue(mockUserWithStringId)

    const locationService = {
      updateUserLocation: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<LocationService>

    await userService.updateUser(
      mockUpdateAttributes as unknown as UpdateUserAttributes,
      locationService,
      minMonthsBetweenDonations,
    )

    expect(userRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        ...expectedUserData,
        age: expect.any(Number),
        id: mockUpdateAttributes.userId,
        updatedAt: expect.any(String)
      })
    )

    expect(locationService.updateUserLocation).toHaveBeenCalledWith(
      mockUpdateAttributes.userId,
      mockUpdateAttributes.preferredDonationLocations,
      expect.objectContaining({
        id: mockUpdateAttributes.userId,
        age: expect.any(Number),
        updatedAt: expect.any(String),
      })
    )
  })

  describe('updateUser countryCode handling', () => {
    const baseUpdateAttributes = {
      userId: '12345',
      name: 'Updated Ebrahim'
    }
    const locationServiceMock = () =>
      ({
        updateUserLocation: jest.fn().mockResolvedValue(undefined)
      } as unknown as jest.Mocked<LocationService>)

    test('should keep the existing profile countryCode even when the request sends another', async() => {
      userService.getUser = jest.fn().mockResolvedValue({ id: '12345', countryCode: 'BD' })
      userRepository.update.mockResolvedValue(mockUserWithStringId)

      await userService.updateUser(
        { ...baseUpdateAttributes, countryCode: 'US' } as UpdateUserAttributes,
        locationServiceMock(),
        minMonthsBetweenDonations
      )

      expect(userRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ countryCode: 'BD' })
      )
    })

    test('should fill a missing profile countryCode from the request', async() => {
      userService.getUser = jest.fn().mockResolvedValue({ id: '12345' })
      userRepository.update.mockResolvedValue(mockUserWithStringId)

      await userService.updateUser(
        { ...baseUpdateAttributes, countryCode: 'BD' } as UpdateUserAttributes,
        locationServiceMock(),
        minMonthsBetweenDonations
      )

      expect(userRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ countryCode: 'BD' })
      )
    })

    test('should omit countryCode entirely when neither profile nor request has one', async() => {
      userService.getUser = jest.fn().mockResolvedValue({ id: '12345' })
      userRepository.update.mockResolvedValue(mockUserWithStringId)

      await userService.updateUser(
        { ...baseUpdateAttributes } as UpdateUserAttributes,
        locationServiceMock(),
        minMonthsBetweenDonations
      )

      const updatedData = userRepository.update.mock.calls[0][0]
      expect('countryCode' in updatedData).toBe(false)
    })
  })

  describe('updateUser profilePicture provenance', () => {
    const googlePicture = 'https://lh3.googleusercontent.com/a/photo.jpg'
    const baseUpdateAttributes = { userId: '12345', name: 'Updated Ebrahim' }
    const locationServiceMock = () =>
      ({
        updateUserLocation: jest.fn().mockResolvedValue(undefined)
      } as unknown as jest.Mocked<LocationService>)

    const runUpdate = async(
      stored: Record<string, unknown>,
      attributes: Record<string, unknown>
    ): Promise<Record<string, unknown>> => {
      userService.getUser = jest.fn().mockResolvedValue({ id: '12345', ...stored })
      userRepository.update.mockResolvedValue(mockUserWithStringId)

      await userService.updateUser(
        { ...baseUpdateAttributes, ...attributes } as UpdateUserAttributes,
        locationServiceMock(),
        minMonthsBetweenDonations
      )

      return userRepository.update.mock.calls[0][0] as Record<string, unknown>
    }

    test('should mark a genuinely new picture as an upload', async() => {
      const updatedData = await runUpdate(
        { profilePicture: googlePicture, profilePictureSource: 'provider' },
        { profilePicture: 'https://cdn.bloodconnect.net/avatars/12345.jpg?v=2' }
      )

      expect(updatedData.profilePictureSource).toBe('upload')
    })

    test('should keep the provider source when the client echoes the stored picture back', async() => {
      const updatedData = await runUpdate(
        { profilePicture: googlePicture, profilePictureSource: 'provider' },
        { profilePicture: googlePicture }
      )

      expect(updatedData.profilePictureSource).toBe('provider')
    })

    test('should keep the provider source when the request omits the picture', async() => {
      const updatedData = await runUpdate(
        { profilePicture: googlePicture, profilePictureSource: 'provider' },
        {}
      )

      expect(updatedData.profilePictureSource).toBe('provider')
    })

    test('should ignore a profilePictureSource supplied by the client', async() => {
      const updatedData = await runUpdate(
        { profilePicture: googlePicture, profilePictureSource: 'provider' },
        { profilePictureSource: 'upload' }
      )

      expect(updatedData.profilePictureSource).toBe('provider')
    })

    test('should omit the source entirely for a legacy profile that has none', async() => {
      const updatedData = await runUpdate(
        { profilePicture: 'https://cdn.bloodconnect.net/avatars/12345.jpg?v=1' },
        {}
      )

      expect('profilePictureSource' in updatedData).toBe(false)
    })
  })

  describe('getAppUserWelcomeMail', () => {
    test('should get welcome mail message correctly', () => {
      const userName = 'Suzan'
      const mockMessage = {
        title: 'Welcome to BloodConnect: Thank You for Signing Up!',
        content: 'Welcome to BloodConnect! We are excited to have you.'
      };
      (getAppUserWelcomeMailMessage as jest.Mock).mockReturnValue(mockMessage)

      const result = userService.getAppUserWelcomeMail(userName)

      expect(getAppUserWelcomeMailMessage).toHaveBeenCalledWith(userName)
      expect(result).toEqual(mockMessage)
    })

    test('should handle empty username', () => {
      const mockMessage = {
        title: 'Welcome to BloodConnect: Thank You for Signing Up!',
        content: 'Welcome to BloodConnect! We are excited to have you.'
      };
      (getAppUserWelcomeMailMessage as jest.Mock).mockReturnValue(mockMessage)

      const result = userService.getAppUserWelcomeMail('')

      expect(getAppUserWelcomeMailMessage).toHaveBeenCalledWith('')
      expect(result).toEqual(mockMessage)
    })

    test('should handle special characters in username', () => {
      const userName = 'John@123#$%'
      const mockMessage = {
        title: 'Welcome to BloodConnect: Thank You for Signing Up!',
        content: 'Welcome to BloodConnect! We are excited to have you.'
      };
      (getAppUserWelcomeMailMessage as jest.Mock).mockReturnValue(mockMessage)

      const result = userService.getAppUserWelcomeMail(userName)

      expect(getAppUserWelcomeMailMessage).toHaveBeenCalledWith(userName)
      expect(result).toEqual(mockMessage)
    })

    test('should handle very long usernames', () => {
      const longUserName
        = 'VeryLongUserNameThatMightCauseIssuesIfNotHandledProperly'
      const mockMessage = {
        title: 'Welcome to BloodConnect: Thank You for Signing Up!',
        content: 'Welcome to BloodConnect! We are excited to have you.'
      };
      (getAppUserWelcomeMailMessage as jest.Mock).mockReturnValue(mockMessage)

      const result = userService.getAppUserWelcomeMail(longUserName)

      expect(getAppUserWelcomeMailMessage).toHaveBeenCalledWith(longUserName)
      expect(result).toEqual(mockMessage)
    })
  })

  describe('syncProviderProfilePicture', () => {
    const userId = '12345'
    const googlePicture = 'https://lh3.googleusercontent.com/a/new.jpg'

    // Stubs the method, not the repository: an earlier test reassigns userService.getUser.
    const mockStoredProfile = (profile: Record<string, unknown>): void => {
      userService.getUser = jest.fn().mockResolvedValue({
        ...mockUserWithStringId,
        ...profile
      })
    }

    test('should backfill the picture for a profile that has none', async() => {
      mockStoredProfile({ profilePicture: undefined, profilePictureSource: undefined })
      userRepository.update.mockResolvedValue(mockUserWithStringId)

      await userService.syncProviderProfilePicture(userId, googlePicture)

      expect(userRepository.update).toHaveBeenCalledWith({
        id: userId,
        profilePicture: googlePicture,
        profilePictureSource: 'provider',
        updatedAt: expect.stringMatching(ISO_TIMESTAMP_REGEX)
      })
    })

    test('should refresh the picture when the provider photo changed', async() => {
      mockStoredProfile({
        profilePicture: 'https://lh3.googleusercontent.com/a/old.jpg',
        profilePictureSource: 'provider'
      })
      userRepository.update.mockResolvedValue(mockUserWithStringId)

      await userService.syncProviderProfilePicture(userId, googlePicture)

      expect(userRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ profilePicture: googlePicture })
      )
    })

    test('should never overwrite a picture stored before provenance was tracked', async() => {
      mockStoredProfile({
        profilePicture: 'https://cdn.bloodconnect.net/avatars/12345.jpg?v=1',
        profilePictureSource: undefined
      })

      await userService.syncProviderProfilePicture(userId, googlePicture)

      expect(userRepository.update).not.toHaveBeenCalled()
    })

    test('should never overwrite a picture the user uploaded themselves', async() => {
      mockStoredProfile({
        profilePicture: 'https://cdn.bloodconnect.net/avatars/12345.jpg?v=1',
        profilePictureSource: 'upload'
      })

      await userService.syncProviderProfilePicture(userId, googlePicture)

      expect(userRepository.update).not.toHaveBeenCalled()
    })

    test('should not write when the stored picture already matches the provider photo', async() => {
      mockStoredProfile({ profilePicture: googlePicture, profilePictureSource: 'provider' })

      await userService.syncProviderProfilePicture(userId, googlePicture)

      expect(userRepository.update).not.toHaveBeenCalled()
    })

    test('should ignore an empty provider picture without reading the profile', async() => {
      mockStoredProfile({})

      await userService.syncProviderProfilePicture(userId, '')

      expect(userService.getUser).not.toHaveBeenCalled()
      expect(userRepository.update).not.toHaveBeenCalled()
    })

    test('should not throw when the user has no profile row yet', async() => {
      userService.getUser = jest.fn().mockRejectedValue(new Error('User not found'))

      await expect(userService.syncProviderProfilePicture(userId, googlePicture))
        .resolves.not.toThrow()

      expect(userRepository.update).not.toHaveBeenCalled()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to sync provider profile picture',
        expect.objectContaining({ userId })
      )
    })
  })

  describe('recordLastSuccessfulLoginTimestamp', () => {
    test('should update last login timestamp successfully', async() => {
      const userId = '12345'
      const timestamp = '2023-10-08T10:30:00.000Z'

      userRepository.update.mockResolvedValue(mockUserWithStringId)

      await userService.recordLastSuccessfulLoginTimestamp(userId, timestamp)

      expect(userRepository.update).toHaveBeenCalledWith({
        id: userId,
        lastLogin: timestamp,
        updatedAt: expect.stringMatching(ISO_TIMESTAMP_REGEX)
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Recording last successful login', { userId, timestamp })
    })

    test('should handle repository update failure gracefully without throwing', async() => {
      const userId = '12345'
      const timestamp = '2023-10-08T10:30:00.000Z'
      const repositoryError = new Error('Database connection failed')

      userRepository.update.mockRejectedValue(repositoryError)

      // Should not throw - errors are caught and logged
      await expect(userService.recordLastSuccessfulLoginTimestamp(userId, timestamp))
        .resolves.not.toThrow()

      expect(mockLogger.info).toHaveBeenCalledWith('Recording last successful login', { userId, timestamp })
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to record last successful login', {
        userId,
        error: repositoryError
      })
    })
  })
})
