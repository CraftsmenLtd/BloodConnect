import { mockedNavigate } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useOtp } from '../../src/authentication/otp/hooks/useOtp'
import { submitOtp } from '../../src/authentication/authService'

jest.mock('../../src/authentication/authService', () => ({
  submitOtp: jest.fn()
}))

describe('useOtp Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useOtp())

    expect(result.current.otp).toEqual(['', '', '', '', '', ''])
    expect(result.current.error).toBe(false)
    expect(result.current.email).toBe('test@example.com')
  })

  test('should handle OTP input change', () => {
    const { result } = renderHook(() => useOtp())

    act(() => {
      result.current.handleOtpChange('1', 0)
    })
    expect(result.current.otp).toEqual(['1', '', '', '', '', ''])

    act(() => {
      result.current.handleOtpChange('2', 1)
    })
    expect(result.current.otp).toEqual(['1', '2', '', '', '', ''])
  })

  test('should focus on the next input when a digit is entered', () => {
    const { result } = renderHook(() => useOtp())
    result.current.inputRefs.current[1] = { focus: jest.fn() }

    act(() => {
      result.current.handleOtpChange('1', 0)
    })

    expect(result.current.inputRefs.current[1].focus).toHaveBeenCalled()
  })

  test('should focus on the previous input when the current digit is deleted', () => {
    const { result } = renderHook(() => useOtp())
    result.current.inputRefs.current[1] = { focus: jest.fn() }
    act(() => {
      result.current.handleOtpChange('1', 0)
    })

    act(() => {
      result.current.handleOtpChange('', 0)
    })
    expect(result.current.inputRefs.current[1].focus).toHaveBeenCalled()
  })

  test('should submit OTP and navigate on success', async() => {
    const { result } = renderHook(() => useOtp());

    (submitOtp as jest.Mock).mockResolvedValue(true)

    await act(async() => {
      await result.current.handleSubmit()
    })

    expect(submitOtp).toHaveBeenCalledTimes(1)
    expect(mockedNavigate).toHaveBeenCalledWith('Profile')
  })

  test('should set error state on submission failure', async() => {
    const { result } = renderHook(() => useOtp())
    result.current.otp = ['1', '2', '3', '4', '5', '6'];

    (submitOtp as jest.Mock).mockRejectedValue(new Error('Submission failed'))

    await act(async() => {
      await result.current.handleSubmit()
    })

    expect(result.current.error).toBe(true)
  })
})
