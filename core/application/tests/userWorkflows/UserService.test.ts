import { UserService } from '../../userWorkflow/UserService'
import { generateUniqueID } from '../../utils/idGenerator'
import {
  getEmailVerificationMessage,
  getPasswordResetVerificationMessage,
  getAppUserWelcomeMailMessage
} from '../../userWorkflow/userMessages'
import { mockUserWithStringId } from '../mocks/mockUserData'
import { mockRepository } from '../mocks/mockRepositories'
import Repository from '../../models/policies/repositories/Repository'
import {
  UserDTO,
  UserDetailsDTO,
  LocationDTO
} from '../../../../commons/dto/UserDTO'
import { UpdateUserAttributes } from '../../userWorkflow/Types'
import LocationRepository from '../../../application/models/policies/repositories/LocationRepository'
import { mockLogger } from '../mocks/mockLogger'

jest.mock('../../utils/idGenerator')
jest.mock('../../userWorkflow/userMessages')

const locationMockRepository = {
  ...mockRepository,
  queryUserLocations: jest.fn(),
  deleteUserLocations: jest.fn()
}
describe('UserService Tests', () => {
  const userService = new UserService()
  const userRepository = mockRepository as jest.Mocked<Repository<UserDTO>>
  const userDetailsRepository = mockRepository as jest.Mocked<
  Repository<UserDetailsDTO>
  >
  const locationRepository = locationMockRepository as jest.Mocked<
  LocationRepository<LocationDTO>
  >
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
      lastVaccinatedDate: '2023-05-01'
    }

    const { userId, ...mockResponse } = mockUpdateAttributes

    userRepository.update.mockResolvedValue(mockUserWithStringId)

    await userService.updateUser(
      mockUpdateAttributes as unknown as UpdateUserAttributes,
      userDetailsRepository,
      locationRepository,
      minMonthsBetweenDonations,
      mockLogger
    )

    expect(userRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockResponse,
        age: expect.any(Number),
        id: mockUpdateAttributes.userId,
        updatedAt: expect.any(String)
      })
    )
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
      const longUserName =
        'VeryLongUserNameThatMightCauseIssuesIfNotHandledProperly'
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
})
