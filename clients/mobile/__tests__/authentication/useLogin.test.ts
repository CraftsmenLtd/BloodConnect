import { mockedNavigate, mockDispatch } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useLogin } from '../../src/authentication/login/hooks/useLogin'
import { loginUser, googleLogin, facebookLogin } from '../../src/authentication/services/authService'
import { CommonActions } from '@react-navigation/native'

jest.mock('../../src/authentication/services/authService', () => ({
  loginUser: jest.fn(),
  googleLogin: jest.fn(),
  facebookLogin: jest.fn()
}))

describe('useLogin Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useLogin())

    const expectedValues = {
      email: '',
      password: ''
    }

    expect(result.current.loginCredential).toEqual(expectedValues)
    expect(result.current.loginError).toBe('')
    expect(result.current.isPasswordVisible).toBe(false)
    expect(result.current.socialLoginError).toBe('')
  })

  test('should toggle password visibility', () => {
    const { result } = renderHook(() => useLogin())

    act(() => {
      result.current.setIsPasswordVisible(true)
    })

    expect(result.current.isPasswordVisible).toBe(true)

    act(() => {
      result.current.setIsPasswordVisible(false)
    })

    expect(result.current.isPasswordVisible).toBe(false)
  })

  test('should update loginCredential when handleInputChange is called', () => {
    const { result } = renderHook(() => useLogin())

    act(() => {
      result.current.handleInputChange('email', 'test@example.com')
    })

    expect(result.current.loginCredential.email).toBe('test@example.com')
  })

  test('should navigate to Profile screen on successful login', async() => {
    const mockAccessToken = 'mockAccessToken'
    const mockIdToken = 'mockIdToken'

    const { result } = renderHook(() => useLogin());
    (loginUser as jest.Mock).mockResolvedValue({
      accessToken: mockAccessToken,
      idToken: mockIdToken,
      isSignedIn: true
    })

    await act(async() => {
      await result.current.handleLogin()
    })
    expect(mockDispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Profile' }]
      })
    )
  })

  test('should set loginError on login failure', async() => {
    const { result } = renderHook(() => useLogin());

    (loginUser as jest.Mock).mockRejectedValue(new Error('Login failed'))

    await act(async() => {
      await result.current.handleLogin()
    })

    expect(result.current.loginError).toBe('Invalid Email or Password.')
  })

  describe('handleGoogleSignIn', () => {
    test('should navigate to Profile screen on successful Google sign-in', async() => {
      const { result } = renderHook(() => useLogin());
      (googleLogin as jest.Mock).mockResolvedValue(undefined)

      await act(async() => {
        await result.current.handleGoogleSignIn()
      })

      expect(googleLogin).toHaveBeenCalledTimes(1)
      expect(mockedNavigate).toHaveBeenCalledWith('Profile')
      expect(result.current.socialLoginError).toBe('')
    })

    test('should set socialLoginError on Google sign-in failure', async() => {
      const { result } = renderHook(() => useLogin());
      (googleLogin as jest.Mock).mockRejectedValue(new Error('Google sign-in failed'))

      await act(async() => {
        await result.current.handleGoogleSignIn()
      })

      expect(googleLogin).toHaveBeenCalledTimes(1)
      expect(mockedNavigate).not.toHaveBeenCalled()
      expect(result.current.socialLoginError).toBe('Failed to sign in with Google.')
    })
  })

  describe('handleFacebookSignIn', () => {
    test('should navigate to Profile screen on successful Facebook sign-in', async() => {
      const { result } = renderHook(() => useLogin());
      (facebookLogin as jest.Mock).mockResolvedValue(undefined)

      await act(async() => {
        await result.current.handleFacebookSignIn()
      })

      expect(facebookLogin).toHaveBeenCalledTimes(1)
      expect(mockedNavigate).toHaveBeenCalledWith('Profile')
      expect(result.current.socialLoginError).toBe('')
    })

    test('should set socialLoginError on Facebook sign-in failure', async() => {
      const { result } = renderHook(() => useLogin());
      (facebookLogin as jest.Mock).mockRejectedValue(new Error('Facebook sign-in failed'))

      await act(async() => {
        await result.current.handleFacebookSignIn()
      })

      expect(facebookLogin).toHaveBeenCalledTimes(1)
      expect(mockedNavigate).not.toHaveBeenCalled()
      expect(result.current.socialLoginError).toBe('Failed to sign in with Facebook.')
    })
  })
})
