import { UserService } from '@application/userWorkflows/UserService'
import { generateUniqueID } from '../../utils/idGenerator'
import { getEmailVerificationMessage, getPasswordResetVerificationMessage } from '@application/userWorkflows/userMessages'
import { mockUserWithStringId } from '../mocks/mockUserData'
import { mockRepository as importedMockRepository } from '../mocks/mockRepositories'

jest.mock('../../utils/idGenerator')
jest.mock('@application/userWorkflows/userMessages')

describe('UserService Tests', () => {
  const userService = new UserService()
  const mockRepository = importedMockRepository

  const mockUserAttributes = {
    email: 'ebrahim@example.com',
    name: 'Ebrahim',
    phone_number: '1234567890'
  }

  beforeEach(() => {
    (generateUniqueID as jest.Mock).mockReturnValue('12345')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should create a new user successfully', async() => {
    mockRepository.create.mockResolvedValue(mockUserWithStringId)
    const result = await userService.createNewUser(mockUserAttributes, mockRepository)

    expect(result).toBe(mockUserWithStringId)
    expect(generateUniqueID).toHaveBeenCalledTimes(1)
    expect(mockRepository.create).toHaveBeenCalledWith({
      ...mockUserWithStringId,
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
    const mockMessage = { body: 'Reset your password for Blood Connect', subject: 'Reset your password' };
    (getPasswordResetVerificationMessage as jest.Mock).mockReturnValue(mockMessage)

    const result = userService.getForgotPasswordMessage('Ebrahim', '1234')
    expect(getPasswordResetVerificationMessage).toHaveBeenCalledWith('Ebrahim', '1234')
    expect(result).toEqual(mockMessage)
  })
})
