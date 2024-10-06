// import '../__mocks__/reactNavigation.mock'
import { mockedNavigate } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useLogin } from '../../src/authentication/login/hooks/useLogin'
import { loginUser, googleLogin, facebookLogin } from '../../src/authentication/authService'

jest.mock('../../src/authentication/authService', () => ({
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
    const { result } = renderHook(() => useLogin());
    (loginUser as jest.Mock).mockResolvedValue(true)

    await act(async() => {
      await result.current.handleLogin()
    })

    expect(mockedNavigate).toHaveBeenCalledWith('Profile')
  })

  test('should set loginError on login failure', async() => {
    const { result } = renderHook(() => useLogin());

    (loginUser as jest.Mock).mockRejectedValue(new Error('Login failed'))

    await act(async() => {
      await result.current.handleLogin()
    })

    expect(result.current.loginError).toBe('Invalid Email or Password.')
  })

  test('should handle Google sign-in successfully', async() => {
    const { result } = renderHook(() => useLogin());
    (googleLogin as jest.Mock).mockResolvedValue(undefined)

    await act(async() => {
      await result.current.handleGoogleSignIn()
    })

    expect(googleLogin).toHaveBeenCalled()
    expect(mockedNavigate).toHaveBeenCalledWith('Profile')
    expect(result.current.socialLoginError).toBe('')
  })

  test('should handle Google sign-in failure', async() => {
    const { result } = renderHook(() => useLogin());
    (googleLogin as jest.Mock).mockRejectedValue(new Error('Google login failed'))

    await act(async() => {
      await result.current.handleGoogleSignIn()
    })

    expect(googleLogin).toHaveBeenCalled()
    expect(mockedNavigate).not.toHaveBeenCalled()
    expect(result.current.socialLoginError).toBe('Failed to sign in with Google.')
  })

  test('should handle Facebook sign-in successfully', async() => {
    const { result } = renderHook(() => useLogin());
    (facebookLogin as jest.Mock).mockResolvedValue(undefined)

    await act(async() => {
      await result.current.handleFacebookSignIn()
    })

    expect(facebookLogin).toHaveBeenCalled()
    expect(mockedNavigate).toHaveBeenCalledWith('Profile')
    expect(result.current.socialLoginError).toBe('')
  })

  test('should handle Facebook sign-in failure', async() => {
    const { result } = renderHook(() => useLogin());
    (facebookLogin as jest.Mock).mockRejectedValue(new Error('Facebook login failed'))

    await act(async() => {
      await result.current.handleFacebookSignIn()
    })

    expect(facebookLogin).toHaveBeenCalled()
    expect(mockedNavigate).not.toHaveBeenCalled()
    expect(result.current.socialLoginError).toBe('Failed to sign in with Facebook.')
  })
})
