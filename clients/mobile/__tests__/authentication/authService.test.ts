import StorageService from '../../src/utility/storageService'
import {
  signUp, confirmSignUp, signIn, signInWithRedirect, decodeJWT,
  fetchAuthSession, signOut, confirmResetPassword, resetPassword
} from 'aws-amplify/auth'
import type {
  UserRegistrationCredentials } from '../../src/authentication/services/authService'
import {
  registerUser,
  submitOtp,
  loginUser,
  googleLogin,
  facebookLogin,
  decodeAccessToken,
  logoutUser,
  fetchSession,
  confirmResetPasswordHandler,
  resetPasswordHandler,
  currentLoggedInUser
} from '../../src/authentication/services/authService'

jest.mock('../../src/utility/storageService', () => ({
  getItem: jest.fn(),
  storeItem: jest.fn(),
  removeItem: jest.fn()
}))

describe('AuthService', () => {
  const mockRegisterInfo: UserRegistrationCredentials = {
    name: 'Ebrahim',
    email: 'ebrahim@example.com',
    phoneNumber: '+1234567890',
    password: 'Password123!'
  }

  const mockEmail = 'test@example.com'
  const mockOtp = '123456'
  const mockPassword = 'Password123!'

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('decodeAccessToken', () => {
    test('should decode the JWT token correctly', () => {
      const token = 'mockToken'
      const decodedPayload = { sub: '12345', exp: Math.floor(Date.now() / 1000) + 60 };

      (decodeJWT as jest.Mock).mockReturnValue({ payload: decodedPayload })

      const result = decodeAccessToken(token)
      expect(decodeJWT).toHaveBeenCalledWith(token)
      expect(result).toEqual(decodedPayload)
    })

    test('should throw an error if token is null', () => {
      expect(() => decodeAccessToken(null)).toThrow("Token Can't be null.")
    })
  })

  describe('logoutUser', () => {
    test('should call signOut and remove tokens from storage', async() => {
      await logoutUser()

      expect(signOut).toHaveBeenCalled()
      expect(StorageService.removeItem).toHaveBeenCalledWith('accessToken')
      expect(StorageService.removeItem).toHaveBeenCalledWith('idToken')
    })

    test('should throw an error if logout fails', async() => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Failed to Logout.'))
      await expect(logoutUser()).rejects.toThrow('Failed to Logout.')
    })
  })

  describe('fetchSession', () => {
    test('should fetch session and store tokens', async() => {
      const mockSession = {
        tokens: {
          accessToken: 'mockAccessToken',
          idToken: 'mockIdToken'
        }
      };
      (fetchAuthSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await fetchSession()

      expect(fetchAuthSession).toHaveBeenCalled()
      expect(result).toEqual(mockSession.tokens)
    })

    test('should throw an error if session or tokens are undefined', async() => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({})

      const result = await fetchSession()
      expect(result).toEqual({ accessToken: undefined, idToken: undefined })
    })

    test('should throw an error if access token or ID token is missing', async() => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({ tokens: {} })

      const result = await fetchSession()
      expect(result).toEqual({ accessToken: undefined, idToken: undefined })
    })

    test('should throw an error if fetching session fails', async() => {
      (fetchAuthSession as jest.Mock).mockRejectedValue(new Error('Session fetch failed'))

      await expect(fetchSession()).rejects.toThrow('Failed to fetch session')
    })
  })

  describe('currentLoggedInUser', () => {
    it('should return user details when session and tokens are valid', async() => {
      const mockSession = {
        tokens: {
          idToken: {
            payload: {
              email: 'test@gmail.com',
              'custom:userId': 'user123',
              phone_number: '1234567890',
              name: 'John Doe'
            }
          }
        }
      };

      (fetchAuthSession as jest.Mock).mockResolvedValue(mockSession)

      const user = await currentLoggedInUser()

      expect(user).toEqual({
        email: 'test@gmail.com',
        userId: 'user123',
        phoneNumber: '1234567890',
        name: 'John Doe'
      })
    })

    it('should throw an error when session or tokens are undefined', async() => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({
        tokens: undefined
      })

      await expect(currentLoggedInUser()).rejects.toThrow('Session or tokens are undefined')
    })
  })

  describe('registerUser', () => {
    test('should return true if registration requires confirmation', async() => {
      (signUp as jest.Mock).mockResolvedValue({
        nextStep: { signUpStep: 'CONFIRM_SIGN_UP' }
      })
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
      (signUp as jest.Mock).mockResolvedValue({
        nextStep: { signUpStep: 'DONE' }
      })

      const result = await registerUser(mockRegisterInfo)
      expect(result).toBe(false)
    })

    test('should throw an error if registration fails with a specific error message', async() => {
      (signUp as jest.Mock).mockRejectedValue(new Error('Username already exists'))
      await expect(registerUser(mockRegisterInfo)).rejects.toThrow(
        'Username already exists'
      )
    })

    test('should throw a generic error if registration fails without a specific error message', async() => {
      (signUp as jest.Mock).mockRejectedValue('Something went wrong.')
      await expect(registerUser(mockRegisterInfo)).rejects.toThrow(
        'Something went wrong.'
      )
    })
  })

  describe('submitOtp', () => {
    const email = 'ebrahim@example.com'
    const otp = '123456'

    test('should return true if OTP confirmation is successful', async() => {
      (confirmSignUp as jest.Mock).mockResolvedValue({
        nextStep: { signUpStep: 'DONE' }
      });

      (fetchAuthSession as jest.Mock).mockResolvedValue({ isSucessRegister: true })

      const result = await submitOtp(email, otp)
      expect(confirmSignUp).toHaveBeenCalledWith({
        username: email,
        confirmationCode: otp
      })
      expect(result).toBe(true)
    })

    test('should return false if OTP confirmation is not yet completed', async() => {
      (confirmSignUp as jest.Mock).mockResolvedValue({
        nextStep: { signUpStep: 'CONFIRM_SIGN_UP' }
      });

      (fetchAuthSession as jest.Mock).mockResolvedValue({ isSucessRegister: false })

      const result = await submitOtp(email, otp)
      expect(result).toEqual(false)
    })

    test('should throw an error if OTP confirmation fails', async() => {
      (confirmSignUp as jest.Mock).mockRejectedValue(new Error('Invalid OTP'))
      await expect(submitOtp(email, otp)).rejects.toThrow(
        'Invalid OTP'
      )
    })

    test('should throw a generic error if OTP confirmation fails without a specific error message', async() => {
      (confirmSignUp as jest.Mock).mockRejectedValue('Unexpected Error')
      await expect(submitOtp(email, otp)).rejects.toThrow(
        'Something went wrong.'
      )
    })
  })

  describe('loginUser', () => {
    const email = 'ebrahim@example.com'
    const password = 'Password123!'

    test('should return true if login is successful', async() => {
      (signIn as jest.Mock).mockResolvedValue({ isSignedIn: true });

      (fetchAuthSession as jest.Mock).mockResolvedValue({
        tokens: {
          accessToken: 'mockAccessToken',
          idToken: 'mockIdToken'
        }
      })

      const result = await loginUser(email, password)
      expect(signIn).toHaveBeenCalledWith({
        username: email,
        password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH'
        }
      })
      expect(result).toEqual(true)
    })

    test('should return false if login is not successful', async() => {
      (signIn as jest.Mock).mockResolvedValue({ isSignedIn: false });

      (fetchAuthSession as jest.Mock).mockResolvedValue({
        tokens: {
          accessToken: 'mockAccessToken',
          idToken: 'mockIdToken'
        }
      })

      const result = await loginUser(email, password)
      expect(result).toEqual(false)
    })

    test('should throw an error if login fails with a specific error message', async() => {
      (signIn as jest.Mock).mockRejectedValue(new Error('Login failed'))
      await expect(loginUser(email, password)).rejects.toThrow(
        'Error logging in user: Login failed'
      )
    })

    test('should throw a generic error if login fails without a specific error message', async() => {
      (signIn as jest.Mock).mockRejectedValue('Unexpected Error')
      await expect(loginUser(email, password)).rejects.toThrow(
        'Error logging in user: Unexpected Error'
      )
    })
  })

  describe('resetPasswordHandler', () => {
    it('should return nextStep on success', async() => {
      const mockNextStep = { step: 'CONFIRM_RESET' };
      (resetPassword as jest.Mock).mockResolvedValueOnce({ nextStep: mockNextStep })

      const result = await resetPasswordHandler(mockEmail)
      expect(result).toEqual(mockNextStep)
      expect(resetPassword).toHaveBeenCalledWith({ username: mockEmail })
    })

    it('should throw an error with a custom message on failure', async() => {
      const errorMessage = 'Network error';
      (resetPassword as jest.Mock).mockRejectedValueOnce(new Error(errorMessage))

      await expect(resetPasswordHandler(mockEmail)).rejects.toThrow(errorMessage)
      expect(resetPassword).toHaveBeenCalledWith({ username: mockEmail })
    })
  })

  describe('handleConfirmPasswordError', () => {
    const handleConfirmPasswordError = (error: unknown): string => {
      if (error instanceof Error) {
        if (error.message.includes('Invalid verification code')) {
          return 'Invalid confirmation code. Please try again.'
        } else if (error.message.includes('Password does not satisfy policy')) {
          return 'Password does not meet requirements. Please choose a different password.'
        } else {
          return 'Reset failed. Please try again.'
        }
      } else {
        return 'An unexpected error occurred. Please try again.'
      }
    }

    it('should return specific error message for "Invalid verification code"', () => {
      const error = new Error('Invalid verification code')
      expect(handleConfirmPasswordError(error)).toBe('Invalid confirmation code. Please try again.')
    })

    it('should return specific error message for "Password does not satisfy policy"', () => {
      const error = new Error('Password does not satisfy policy')
      expect(handleConfirmPasswordError(error)).toBe('Password does not meet requirements. Please choose a different password.')
    })

    it('should return default error message for other errors', () => {
      const error = new Error('Some other error')
      expect(handleConfirmPasswordError(error)).toBe('Reset failed. Please try again.')
    })

    it('should return generic error message for non-Error objects', () => {
      const error = 'Unexpected error'
      expect(handleConfirmPasswordError(error)).toBe('An unexpected error occurred. Please try again.')
    })
  })

  describe('confirmResetPasswordHandler', () => {
    it('should return true on successful password confirmation', async() => {
      (confirmResetPassword as jest.Mock).mockResolvedValueOnce(true)

      const result = await confirmResetPasswordHandler(mockEmail, mockOtp, mockPassword)
      expect(result).toBe(true)
      expect(confirmResetPassword).toHaveBeenCalledWith({
        username: mockEmail,
        confirmationCode: mockOtp,
        newPassword: mockPassword
      })
    })

    it('should throw a custom error message on failure', async() => {
      const errorMessage = 'Invalid verification code';
      (confirmResetPassword as jest.Mock).mockRejectedValueOnce(new Error(errorMessage))

      await expect(confirmResetPasswordHandler(mockEmail, mockOtp, mockPassword)).rejects.toThrow(
        'Invalid confirmation code. Please try again.'
      )
      expect(confirmResetPassword).toHaveBeenCalledWith({
        username: mockEmail,
        confirmationCode: mockOtp,
        newPassword: mockPassword
      })
    })
  })

  describe('googleLogin', () => {
    test('should throw an error if Google sign-in fails', async() => {
      (signInWithRedirect as jest.Mock).mockRejectedValue(new Error('Google sign-in failed'))

      await expect(googleLogin()).rejects.toThrow('Error logging with google: Google sign-in failed')
    })
  })

  describe('facebookLogin', () => {
    test('should throw an error if Facebook sign-in fails', async() => {
      (signInWithRedirect as jest.Mock).mockRejectedValue(new Error('Facebook sign-in failed'))

      await expect(facebookLogin()).rejects.toThrow('Error logging with facebook: Facebook sign-in failed')
    })
  })
})
