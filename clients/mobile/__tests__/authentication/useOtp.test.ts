import { mockDispatch, setRouteParams } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useOtp } from '../../src/authentication/otp/hooks/useOtp'
import { loginUser, submitOtp } from '../../src/authentication/services/authService'
import { SCREENS } from '../../src/setup/constant/screens'
import { CommonActions } from '@react-navigation/native'

jest.mock('../../src/authentication/services/authService', () => ({
  submitOtp: jest.fn(),
  loginUser: jest.fn()
}))

jest.mock('../../src/utility/deviceRegistration')

describe('useOtp Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setRouteParams({
      email: 'test@example.com',
      password: 'Qweqwe12@#',
      fromScreen: SCREENS.SET_PASSWORD
    })
  })
  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useOtp())

    expect(result.current.otp).toEqual(['', '', '', '', '', ''])
    expect(result.current.error).toBe('')
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
    const mockEmail = 'test@example.com'
    const { result } = renderHook(() => useOtp())

    await act(async() => {
      result.current.handleOtpChange('1', 0)
    })
    await act(async() => {
      result.current.handleOtpChange('2', 1)
    })
    await act(async() => {
      result.current.handleOtpChange('3', 2)
    })
    await act(async() => {
      result.current.handleOtpChange('4', 3)
    })
    await act(async() => {
      result.current.handleOtpChange('5', 4)
    })
    await act(async() => {
      result.current.handleOtpChange('6', 5)
    });

    (submitOtp as jest.Mock).mockResolvedValue(true);
    (loginUser as jest.Mock).mockResolvedValue(true)

    await act(async() => {
      await result.current.handleSubmit()
      jest.runAllTimers()
    })

    expect(submitOtp).toHaveBeenCalledTimes(1)
    expect(submitOtp).toHaveBeenCalledWith(mockEmail, '123456')

    expect(mockDispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: SCREENS.ADD_PERSONAL_INFO }]
      })
    )
  })

  test('should set error state on submission failure', async() => {
    const { result } = renderHook(() => useOtp())

    await act(async() => {
      result.current.handleOtpChange('1', 0)
    })
    await act(async() => {
      result.current.handleOtpChange('2', 1)
    })
    await act(async() => {
      result.current.handleOtpChange('3', 2)
    })
    await act(async() => {
      result.current.handleOtpChange('4', 3)
    })
    await act(async() => {
      result.current.handleOtpChange('5', 4)
    })
    await act(async() => {
      result.current.handleOtpChange('6', 5)
    });

    (submitOtp as jest.Mock).mockRejectedValue(new Error('Submission failed'))

    await act(async() => {
      await result.current.handleSubmit()
    })

    expect(result.current.error).toBe('Submission failed')
  })
})
