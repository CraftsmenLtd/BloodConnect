import { renderHook, act } from '@testing-library/react-native'
import { useLogin } from '../../src/authentication/login/hooks/useLogin'
import { loginUser, googleLogin, facebookLogin } from '../../src/authentication/services/authService'
import { SCREENS } from '../../src/setup/constant/screens'

const mockDispatch = jest.fn()
const mockSetIsAuthenticated = jest.fn()
let mockUserProfile: { bloodGroup?: string } | null = null

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    dispatch: mockDispatch,
    navigate: jest.fn()
  }),
  CommonActions: {
    reset: (config: any) => config
  }
}))

jest.mock('../../src/authentication/services/authService', () => ({
  loginUser: jest.fn(),
  googleLogin: jest.fn(),
  facebookLogin: jest.fn()
}))

jest.mock('../../src/userWorkflow/context/UserProfileContext', () => ({
  useUserProfile: () => ({
    userProfile: mockUserProfile,
    loading: false,
    error: null,
    fetchUserProfile: jest.fn()
  })
}))

jest.mock('../../src/authentication/context/useAuth', () => ({
  useAuth: () => ({
    setIsAuthenticated: mockSetIsAuthenticated,
    accessToken: null,
    idToken: null,
    isAuthenticated: false,
    loading: false,
    logoutUser: jest.fn()
  })
}))

jest.mock('../../src/setup/clients/useFetchClient', () => ({
  useFetchClient: () => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn()
  })
}))

jest.mock('../../src/utility/deviceRegistration', () => ({
  __esModule: true,
  default: jest.fn()
}))

describe('useLogin Hook', () => {
  beforeEach(() => {
    mockUserProfile = null
    jest.clearAllMocks()
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
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

  test('should set loginError on login failure', async() => {
    const { result } = renderHook(() => useLogin());

    (loginUser as jest.Mock).mockRejectedValue(new Error('Login failed'))

    await act(async() => {
      await result.current.handleLogin()
    })

    expect(result.current.loginError).toBe('Invalid Email or Password.')
  })

  test('should navigate to BOTTOM_TABS on successful login', async() => {
    const { result } = renderHook(() => useLogin());
    (loginUser as jest.Mock).mockResolvedValue(true)

    await act(async() => {
      await result.current.handleLogin()
      jest.runAllTimers()
    })

    expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true)
    expect(mockDispatch).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: SCREENS.BOTTOM_TABS }]
    })
  })

  describe('handleGoogleSignIn', () => {
    test('should fail gracefully when Google sign-in has session error', async() => {
      const { result } = renderHook(() => useLogin());
      (googleLogin as jest.Mock).mockRejectedValue(new Error('Failed to fetch session'))

      await act(async() => {
        await result.current.handleGoogleSignIn()
      })

      expect(googleLogin).toHaveBeenCalledTimes(1)
      expect(mockDispatch).not.toHaveBeenCalled()
      expect(result.current.socialLoginError).toBe('Google login failed. Please try again.')
    })

    test('should set socialLoginError on Google sign-in failure', async() => {
      const { result } = renderHook(() => useLogin());
      (googleLogin as jest.Mock).mockRejectedValue(new Error('Google sign-in failed'))

      await act(async() => {
        await result.current.handleGoogleSignIn()
      })

      expect(googleLogin).toHaveBeenCalledTimes(1)
      expect(result.current.socialLoginError).toBe('Google login failed. Please try again.')
    })

    test('should navigate to ADD_PERSONAL_INFO when no profile exists', async() => {
      mockUserProfile = null;
      (googleLogin as jest.Mock).mockResolvedValue(undefined)

      const { result } = renderHook(() => useLogin())

      await act(async() => {
        await result.current.handleGoogleSignIn()
        jest.runAllTimers()
      })

      expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: SCREENS.ADD_PERSONAL_INFO }]
      })
    })

    test('should navigate to BOTTOM_TABS when profile exists', async() => {
      mockUserProfile = { bloodGroup: 'A+' };
      (googleLogin as jest.Mock).mockResolvedValue(undefined)

      const { result } = renderHook(() => useLogin())

      await act(async() => {
        await result.current.handleGoogleSignIn()
        jest.runAllTimers()
      })

      expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: SCREENS.BOTTOM_TABS }]
      })
    })
  })

  describe('handleFacebookSignIn', () => {
    test('should fail gracefully when Facebook sign-in has session error', async() => {
      const { result } = renderHook(() => useLogin());
      (facebookLogin as jest.Mock).mockRejectedValue(new Error('Failed to fetch session'))

      await act(async() => {
        await result.current.handleFacebookSignIn()
      })

      expect(facebookLogin).toHaveBeenCalledTimes(1)
      expect(mockDispatch).not.toHaveBeenCalled()
      expect(result.current.socialLoginError).toBe('Facebook login failed. Please try again.')
    })

    test('should set socialLoginError on Facebook sign-in failure', async() => {
      const { result } = renderHook(() => useLogin());
      (facebookLogin as jest.Mock).mockRejectedValue(new Error('Facebook sign-in failed'))

      await act(async() => {
        await result.current.handleFacebookSignIn()
      })

      expect(facebookLogin).toHaveBeenCalledTimes(1)
      expect(result.current.socialLoginError).toBe('Facebook login failed. Please try again.')
    })

    test('should navigate to ADD_PERSONAL_INFO when no profile exists', async() => {
      mockUserProfile = null;
      (facebookLogin as jest.Mock).mockResolvedValue(undefined)

      const { result } = renderHook(() => useLogin())

      await act(async() => {
        await result.current.handleFacebookSignIn()
        jest.runAllTimers()
      })

      expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: SCREENS.ADD_PERSONAL_INFO }]
      })
    })

    test('should navigate to BOTTOM_TABS when profile exists', async() => {
      mockUserProfile = { bloodGroup: 'A+' };
      (facebookLogin as jest.Mock).mockResolvedValue(undefined)

      const { result } = renderHook(() => useLogin())

      await act(async() => {
        await result.current.handleFacebookSignIn()
        jest.runAllTimers()
      })

      expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: SCREENS.BOTTOM_TABS }]
      })
    })
  })
})
