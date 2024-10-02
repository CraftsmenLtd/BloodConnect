import { mockedNavigate } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useRegister } from '../../src/authentication/register/hooks/useRegister'
import { registerUser } from '../../src/authentication/authService'

jest.mock('../../src/authentication/authService', () => ({
  registerUser: jest.fn()
}))

describe('useRegister Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRegister())
    const expectedValues = {
      name: '',
      email: '',
      phoneNumber: '',
      password: ''
    }

    expect(result.current.registerCredential).toEqual(expectedValues)
    expect(result.current.errors).toEqual(expectedValues)
    expect(result.current.signupError).toBe('')
    expect(result.current.isPasswordVisible).toBe(false)
  })

  it('should update registerCredential when handleInputChange is called', () => {
    const { result } = renderHook(() => useRegister())

    act(() => {
      result.current.handleInputChange('email', 'test@example.com')
    })
    expect(result.current.registerCredential.email).toBe('test@example.com')
  })

  it('should navigate to OTP screen on successful registration', async() => {
    const { result } = renderHook(() => useRegister());
    (registerUser as jest.Mock).mockResolvedValue(true)

    await act(async() => {
      await result.current.handleRegister()
    })
    expect(mockedNavigate).toHaveBeenCalledWith('OTP', { email: '' })
  })

  it('should set signupError on registration failure', async() => {
    const { result } = renderHook(() => useRegister());
    (registerUser as jest.Mock).mockRejectedValue(new Error('Registration failed'))

    await act(async() => {
      await result.current.handleRegister()
    })
    expect(result.current.signupError).toBe('Failed to sign up. Please try again later.')
  })
})
