import Repository from '@application/technicalImpl/policies/repositories/Repository'
import { UserService } from '@application/userWorkflows/UserService'
import { generateUniqueID } from '../../utils/ksuidGenerator'
import { UserDTO } from '@commons/dto/UserDTO'
import { getEmailVerificationMessage, getPasswordResetVerificationMessage } from '@application/userWorkflows/userMessages'

jest.mock('../../utils/ksuidGenerator')
jest.mock('@application/userWorkflows/userMessages')

describe('UserService Tests', () => {
  let userService: UserService
  let mockRepository: jest.Mocked<Repository<UserDTO>>

  const mockUserAttributes = {
    email: 'ebrahim@example.com',
    name: 'Ebrahim',
    phone_number: '1234567890'
  }

  beforeEach(() => {
    userService = new UserService()

    mockRepository = {
      create: jest.fn()
    };
    (generateUniqueID as jest.Mock).mockReturnValue('unique-id')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should create a new user successfully', async() => {
    const mockUser: UserDTO = {
      id: 'unique-id',
      email: mockUserAttributes.email,
      phone: mockUserAttributes.phone_number,
      name: mockUserAttributes.name,
      registrationDate: new Date()
    }

    mockRepository.create.mockResolvedValue(mockUser)

    const result = await userService.createNewUser(mockUserAttributes, mockRepository)

    expect(result).toBe(mockUser)

    expect(generateUniqueID).toHaveBeenCalledTimes(1)

    expect(mockRepository.create).toHaveBeenCalledWith({
      id: 'unique-id',
      email: mockUserAttributes.email,
      phone: mockUserAttributes.phone_number,
      name: mockUserAttributes.name,
      registrationDate: expect.any(Date)
    })
  })

  test('should throw an error on failure', async() => {
    const errorMessage = 'Database error'
    const originalError = new Error(errorMessage)

    mockRepository.create.mockRejectedValue(originalError)
    await expect(userService.createNewUser(mockUserAttributes, mockRepository))
      .rejects.toThrow(new Error(errorMessage))
    expect(mockRepository.create).toHaveBeenCalledTimes(1)
  })

  test('should get post-signup message correctly', () => {
    const mockMessage = { title: 'Welcome to Blood Connect!', content: 'Verify your email' };
    (getEmailVerificationMessage as jest.Mock).mockReturnValue(mockMessage)

    const result = userService.getPostSignUpMessage('Ebrahim', '1234')
    expect(getEmailVerificationMessage).toHaveBeenCalledWith('Ebrahim', '1234')
    expect(result).toEqual(mockMessage)
  })

  test('should get forgot password message correctly', () => {
    const mockMessage = { body: 'Reset your password for Blood Connect', subject: 'Reset your password' }
    ;(getPasswordResetVerificationMessage as jest.Mock).mockReturnValue(mockMessage)

    const result = userService.getForgotPasswordMessage('Ebrahim', '1234')
    expect(getPasswordResetVerificationMessage).toHaveBeenCalledWith('Ebrahim', '1234')
    expect(result).toEqual(mockMessage)
  })
})
