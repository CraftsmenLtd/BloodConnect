import { mockedNavigate } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useForgotPassword } from '../../src/authentication/forgotPassword/hooks/useForgotPassword'
import { resetPasswordHandler } from '../../src/authentication/services/authService'
import { SCREENS } from '../../src/setup/constant/screens'

jest.mock('../../src/authentication/services/authService', () => ({
  resetPasswordHandler: jest.fn()
}))

describe('useForgotPassword Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useForgotPassword())

    expect(result.current.credentials).toEqual({ email: '' })
    expect(result.current.errors).toEqual({ email: null })
    expect(result.current.error).toBe('')
    expect(result.current.loading).toBe(false)
    expect(result.current.isButtonDisabled).toBe(true)
  })

  test('should handle input change and validation', () => {
    const { result } = renderHook(() => useForgotPassword())

    act(() => {
      result.current.handleInputChange('email', 'invalid-email')
    })

    expect(result.current.credentials.email).toBe('invalid-email')
    expect(result.current.errors.email).toBe('Invalid email address')

    act(() => {
      result.current.handleInputChange('email', 'valid@example.com')
    })

    expect(result.current.credentials.email).toBe('valid@example.com')
    expect(result.current.errors.email).toBe(null)
  })

  test('should disable button if input is invalid', () => {
    const { result } = renderHook(() => useForgotPassword())

    act(() => {
      result.current.handleInputChange('email', 'invalid-email')
    })

    expect(result.current.isButtonDisabled).toBe(true)
  })

  test('should enable button if input is valid', () => {
    const { result } = renderHook(() => useForgotPassword())

    act(() => {
      result.current.handleInputChange('email', 'valid@example.com')
    })

    expect(result.current.isButtonDisabled).toBe(false)
  })

  test('should handle successful forgot password request and navigate', async() => {
    const { result } = renderHook(() => useForgotPassword());

    (resetPasswordHandler as jest.Mock).mockResolvedValue({
      resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE'
    })

    act(() => {
      result.current.handleInputChange('email', 'valid@example.com')
    })

    await act(async() => {
      await result.current.handleForgotPassword()
    })

    expect(result.current.loading).toBe(false)
    expect(mockedNavigate).toHaveBeenCalledWith(SCREENS.OTP, {
      email: 'valid@example.com',
      password: '',
      fromScreen: SCREENS.FORGOT_PASSWORD
    })
    expect(result.current.error).toBe('')
  })

  test('should handle already completed reset password request', async() => {
    const { result } = renderHook(() => useForgotPassword());

    (resetPasswordHandler as jest.Mock).mockResolvedValue({
      resetPasswordStep: 'DONE'
    })

    act(() => {
      result.current.handleInputChange('email', 'valid@example.com')
    })

    await act(async() => {
      await result.current.handleForgotPassword()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Password reset process already completed.')
  })

  test('should set error state on reset password failure', async() => {
    const { result } = renderHook(() => useForgotPassword());

    (resetPasswordHandler as jest.Mock).mockRejectedValue(new Error('Reset password failed'))

    act(() => {
      result.current.handleInputChange('email', 'valid@example.com')
    })

    await act(async() => {
      await result.current.handleForgotPassword()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Reset password failed')
  })
})
