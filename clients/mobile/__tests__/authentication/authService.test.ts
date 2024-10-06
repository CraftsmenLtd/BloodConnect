import { signUp, confirmSignUp, signIn } from 'aws-amplify/auth'
import { registerUser, submitOtp, loginUser, UserRegistrationCredentials } from '../../src/authentication/authService'

jest.mock('aws-amplify/auth', () => ({
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
  signIn: jest.fn()
}))

describe('AuthService', () => {
  const mockRegisterInfo: UserRegistrationCredentials = {
    name: 'Ebrahim',
    email: 'ebrahim@example.com',
    phoneNumber: '+1234567890',
    password: 'Password123!'
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('registerUser', () => {
    test('should return true if registration requires confirmation', async() => {
      (signUp as jest.Mock).mockResolvedValue({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } })
      const result = await registerUser(mockRegisterInfo)

      expect(signUp).toHaveBeenCalledWith({
        username: mockRegisterInfo.email,
        password: mockRegisterInfo.password,
        options: {
          userAttributes: {
            email: mockRegisterInfo.email,
            name: mockRegisterInfo.name,
            phone_number: mockRegisterInfo.phoneNumber
          }
        }
      })
      expect(result).toBe(true)
    })

    test('should return false if registration does not require confirmation', async() => {
      (signUp as jest.Mock).mockResolvedValue({ nextStep: { signUpStep: 'DONE' } })

      const result = await registerUser(mockRegisterInfo)
      expect(result).toBe(false)
    })

    test('should throw an error if registration fails with a specific error message', async() => {
      (signUp as jest.Mock).mockRejectedValue(new Error('Username already exists'))
      await expect(registerUser(mockRegisterInfo)).rejects.toThrow('Error registering user: Username already exists')
    })

    test('should throw a generic error if registration fails without a specific error message', async() => {
      (signUp as jest.Mock).mockRejectedValue('Unexpected Error')
      await expect(registerUser(mockRegisterInfo)).rejects.toThrow('Error registering user: Unexpected Error')
    })
  })

  describe('submitOtp', () => {
    const email = 'ebrahim@example.com'
    const otp = '123456'

    test('should return true if OTP confirmation is successful', async() => {
      (confirmSignUp as jest.Mock).mockResolvedValue({ nextStep: { signUpStep: 'DONE' } })
      const result = await submitOtp(email, otp)

      expect(confirmSignUp).toHaveBeenCalledWith({
        username: email,
        confirmationCode: otp
      })
      expect(result).toBe(true)
    })

    test('should return false if OTP confirmation is not yet completed', async() => {
      (confirmSignUp as jest.Mock).mockResolvedValue({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } })
      const result = await submitOtp(email, otp)
      expect(result).toBe(false)
    })

    test('should throw an error if OTP confirmation fails with a specific error message', async() => {
      (confirmSignUp as jest.Mock).mockRejectedValue(new Error('Invalid OTP'))
      await expect(submitOtp(email, otp)).rejects.toThrow('Error confirming sign-up with OTP: Invalid OTP')
    })

    test('should throw a generic error if OTP confirmation fails without a specific error message', async() => {
      (confirmSignUp as jest.Mock).mockRejectedValue('Unexpected Error')
      await expect(submitOtp(email, otp)).rejects.toThrow('Error confirming sign-up with OTP: Unexpected Error')
    })
  })

  describe('loginUser', () => {
    const email = 'ebrahim@example.com'
    const password = 'Password123!'

    test('should return true if login is successful', async() => {
      (signIn as jest.Mock).mockResolvedValue({ isSignedIn: true })
      const result = await loginUser(email, password)

      expect(signIn).toHaveBeenCalledWith({
        username: email,
        password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH'
        }
      })
      expect(result).toBe(true)
    })

    test('should return false if login is not successful', async() => {
      (signIn as jest.Mock).mockResolvedValue({ isSignedIn: false })

      const result = await loginUser(email, password)
      expect(result).toBe(false)
    })

    test('should throw an error if login fails with a specific error message', async() => {
      (signIn as jest.Mock).mockRejectedValue(new Error('Login failed'))
      await expect(loginUser(email, password)).rejects.toThrow('Error logging in user: Login failed')
    })

    test('should throw a generic error if login fails without a specific error message', async() => {
      (signIn as jest.Mock).mockRejectedValue('Unexpected Error')
      await expect(loginUser(email, password)).rejects.toThrow('Error logging in user: Unexpected Error')
    })
  })
})
