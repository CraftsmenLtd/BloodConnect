import { mockedNavigate } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useRegister } from '../../src/authentication/register/hooks/useRegister'

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
      params: { email: '', name: '', phoneNumber: '', password: '' },
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
    expect(result.current.isButtonDisabled).toBe(true)
  })

  it('should set error messages correctly', () => {
    const { result } = renderHook(() => useRegister())

    act(() => {
      result.current.handleInputChange('email', 'invalidEmail')
    })

    expect(result.current.errors.email).toBe('Invalid email address')
  })
})
