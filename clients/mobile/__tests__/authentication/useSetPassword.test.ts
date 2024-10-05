import '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useSetPassword } from '../../src/authentication/setPassword/hooks/useSetPassword'
import { registerUser } from '../../src/authentication/authService'
import { SCREENS } from '../../src/setup/constant/screens'

jest.mock('../../src/authentication/authService', () => ({
  registerUser: jest.fn()
}))

describe('useSetPassword Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useSetPassword())

    const expectedValues = {
      password: '',
      confirmPassword: ''
    }

    expect(result.current.newPassword).toEqual(expectedValues)
    expect(result.current.errors).toEqual(expectedValues)
    expect(result.current.error).toBe('')
  })

  test('should update newPassword when handleInputChange is called', () => {
    const { result } = renderHook(() => useSetPassword())

    act(() => {
      result.current.handleInputChange('password', 'Password123')
    })
    expect(result.current.newPassword.password).toBe('Password123')
  })

  test('should validate password inputs correctly', () => {
    const { result } = renderHook(() => useSetPassword())

    act(() => {
      result.current.handleInputChange('password', 'short')
    })
    expect(result.current.errors.password).toBe('Password must contain: Min 10 chars, 1 number, 1 symbol')

    act(() => {
      result.current.handleInputChange('confirmPassword', 'differentPassword')
    })
    expect(result.current.errors.confirmPassword).toBe('Passwords do not match.')
  })

  test('should enable the button only when inputs are valid', () => {
    const { result } = renderHook(() => useSetPassword())

    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.handleInputChange('password', 'Password123!')
    })
    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.handleInputChange('confirmPassword', 'Password123!')
    })
    expect(result.current.isButtonDisabled).toBe(false)
  })

  test('should handle errors when password setting fails', async() => {
    const params = { email: 'ebrahim@example.com' }
    const fromScreen = SCREENS.REGISTER

    const { result } = renderHook(() => useSetPassword())
    result.current.routeParams = { params, fromScreen };
    (registerUser as jest.Mock).mockRejectedValue(new Error('Registration failed'))

    await act(async() => {
      await result.current.handleSetPassword()
    })
    expect(result.current.error).toBe('Failed to sign up. Please try again later.')
  })
})
