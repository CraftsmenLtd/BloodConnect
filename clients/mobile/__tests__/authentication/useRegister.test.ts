import { mockedNavigate, setRouteParams } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useRegister } from '../../src/authentication/register/hooks/useRegister'
import { googleLogin, facebookLogin } from '../../src/authentication/services/authService'

jest.mock('../../src/authentication/services/authService', () => ({
  registerUser: jest.fn(),
  googleLogin: jest.fn(),
  facebookLogin: jest.fn()
}))

jest.mock('../../src/authentication/context/useAuth', () => ({
  useAuth: () => ({
    setIsAuthenticated: jest.fn(),
    accessToken: null,
    idToken: null,
    isAuthenticated: false,
    loading: false,
    logoutUser: jest.fn()
  })
}))

jest.mock('../../src/userWorkflow/context/UserProfileContext', () => ({
  useUserProfile: () => ({
    userProfile: null,
    loading: false,
    error: null,
    fetchUserProfile: jest.fn()
  })
}))

jest.mock('../../src/setup/clients/useFetchClient', () => ({
  useFetchClient: () => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn()
  })
}))

describe('useRegister Hook', () => {
  beforeEach(() => {
    setRouteParams({ email: 'test@example.com' })
    jest.clearAllMocks()
  })

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useRegister())
    const expectedValues = {
      name: '',
      email: '',
      phoneNumber: ''
    }

    expect(result.current.registerCredential).toEqual(expectedValues)
    expect(result.current.errors).toEqual(expectedValues)
  })

  it('should update registerCredential when handleInputChange is called', () => {
    const { result } = renderHook(() => useRegister())

    act(() => {
      result.current.handleInputChange('email', 'ebrahim@example.com')
    })
    expect(result.current.registerCredential.email).toBe('ebrahim@example.com')
  })

  it('should navigate to SetPassword screen on registration', async() => {
    const { result } = renderHook(() => useRegister())

    await act(async() => {
      await result.current.handleRegister()
    })

    expect(mockedNavigate).toHaveBeenCalledWith('SetPassword', {
      routeParams: { email: '', name: '', phoneNumber: '', password: '' },
      fromScreen: 'Register'
    })
  })

  it('should disable the button if required fields are empty', () => {
    const { result } = renderHook(() => useRegister())

    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.handleInputChange('name', 'John Doe')
    })
    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.handleInputChange('email', 'ebrahim@example.com')
    })
    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.handleInputChange('phoneNumber', '1234567890')
    })
    expect(result.current.isButtonDisabled).toBe(false)
  })

  it('should set error messages correctly', () => {
    const { result } = renderHook(() => useRegister())

    act(() => {
      result.current.handleInputChange('email', 'invalidEmail')
    })

    expect(result.current.errors.email).toBe('Invalid email address')
  })

  describe('handleGoogleSignIn', () => {
    test('should fail gracefully when Google sign-in has session error', async() => {
      const { result } = renderHook(() => useRegister());
      (googleLogin as jest.Mock).mockRejectedValue(new Error('Failed to fetch session'))

      await act(async() => {
        await result.current.handleGoogleSignIn()
      })

      expect(googleLogin).toHaveBeenCalledTimes(1)
      expect(mockedNavigate).not.toHaveBeenCalled()
      expect(result.current.socialLoginError).toBe('google login failed. Please try again.')
    })

    test('should set socialLoginError on Google sign-in failure', async() => {
      const { result } = renderHook(() => useRegister());
      (googleLogin as jest.Mock).mockRejectedValue(new Error('Google sign-in failed'))

      await act(async() => {
        await result.current.handleGoogleSignIn()
      })

      expect(googleLogin).toHaveBeenCalledTimes(1)
      expect(result.current.socialLoginError).toBe('google login failed. Please try again.')
    })
  })

  describe('handleFacebookSignIn', () => {
    test('should fail gracefully when Facebook sign-in has session error', async() => {
      const { result } = renderHook(() => useRegister());
      (facebookLogin as jest.Mock).mockRejectedValue(new Error('Failed to fetch session'))

      await act(async() => {
        await result.current.handleFacebookSignIn()
      })

      expect(facebookLogin).toHaveBeenCalledTimes(1)
      expect(mockedNavigate).not.toHaveBeenCalled()
      expect(result.current.socialLoginError).toBe('facebook login failed. Please try again.')
    })

    test('should set socialLoginError on Facebook sign-in failure', async() => {
      const { result } = renderHook(() => useRegister());
      (facebookLogin as jest.Mock).mockRejectedValue(new Error('Facebook sign-in failed'))

      await act(async() => {
        await result.current.handleFacebookSignIn()
      })

      expect(facebookLogin).toHaveBeenCalledTimes(1)
      expect(result.current.socialLoginError).toBe('facebook login failed. Please try again.')
    })
  })
})
