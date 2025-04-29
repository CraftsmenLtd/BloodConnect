import { useState, useRef, useMemo, useEffect } from 'react'
import type { TextInput } from 'react-native'
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native'
import type { 
  OtpScreenNavigationProp, 
  OtpScreenRouteProp
} from '../../../setup/navigation/navigationTypes'
import { 
  submitOtp, 
  loginUser, 
  resetPasswordHandler, 
  resendSignUpOtp
} from '../../services/authService'
import { SCREENS } from '../../../setup/constant/screens'
import { useAuth } from '../../context/useAuth'
import registerUserDeviceForNotification from '../../../utility/deviceRegistration'
import { useFetchClient } from '../../../setup/clients/useFetchClient'

const RESEND_CODE_COUNTDOWN = 120

export const useOtp = (): unknown => {
  const fetchClient = useFetchClient()
  const { setIsAuthenticated } = useAuth()
  const navigation = useNavigation<OtpScreenNavigationProp>()
  const route = useRoute<OtpScreenRouteProp>()
  const { email, password, fromScreen } = route.params
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string>('')
  const inputRefs = useRef<Array<TextInput | null>>([])
  const [countdown, setCountdown] = useState<number | null>(RESEND_CODE_COUNTDOWN)
  const [isDisabled, setIsDisabled] = useState(false)
  const [countdownStarted, setCountdownStarted] = useState(false)

  useEffect(() => {
    if (countdown !== null && countdown > 0 && countdownStarted) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null))
      }, 1000)
      return () => { clearInterval(timer) }
    } else if (countdown === 0) {
      setIsDisabled(false)
      setCountdown(null)
    }
  }, [countdown, countdownStarted])

  const handleOtpChange = (text: string, index: number): void => {
    const newOtp = [...otp]
    newOtp[index] = text
    setOtp(newOtp)

    if (text !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (text === '' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const isButtonDisabled = useMemo(() => otp.join('').trim().length !== 6, [otp])

  const handleRegister = async(): Promise<void> => {
    const isRegistrationSuccessful = await submitOtp(email, otp.join(''))
    if (isRegistrationSuccessful) {
      const isSignedIn = await loginUser(email, password)
      if (isSignedIn) {
        setIsAuthenticated(true)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: SCREENS.ADD_PERSONAL_INFO }]
          })
        )
      } else {
        navigation.navigate(SCREENS.LOGIN)
      }
    } else {
      setError('Verification incomplete. Please follow further steps.')
    }
  }

  const resendForgotPasswordOtpHandler = async(email: string): Promise<void> => {
    const nextStep = await resetPasswordHandler(email)
    switch (nextStep.resetPasswordStep) {
    case 'CONFIRM_RESET_PASSWORD_WITH_CODE':
      setCountdown(RESEND_CODE_COUNTDOWN);
      setIsDisabled(true);
      setCountdownStarted(true);
      break;
    case 'DONE':
      setError('Password reset process already completed.');
      break;
    default:
      setError('Password reset failed. Check your email or try again.');
    }
  }

  const resendSignUpOtpHandler = async(): Promise<void> => {
    const isResendCodeSuccessful = await resendSignUpOtp(email)
    if (isResendCodeSuccessful) {
      setCountdown(RESEND_CODE_COUNTDOWN)
      setIsDisabled(true)
      setCountdownStarted(true)
    }
  }

  const resendOtpHandler = async(): Promise<void> => {
    try {
      if (fromScreen === SCREENS.SET_PASSWORD) {
        await resendSignUpOtpHandler()
      } else {
        await resendForgotPasswordOtpHandler(email)
      }
    } catch (error) {
      const errorMessage = `${error instanceof Error ? error.message : 'Unknown issue.'}`
      setError(errorMessage)
    }
  }

  const handleSubmit = async(): Promise<void> => {
    setLoading(true)
    try {
      if (fromScreen === SCREENS.SET_PASSWORD) {
        await handleRegister()
        registerUserDeviceForNotification(fetchClient)
      } else {
        navigation.navigate(
          SCREENS.SET_PASSWORD,
          {
            routeParams: {
              email, otp:
                otp.join('')
            },
            fromScreen: SCREENS.OTP
          }
        )
      }
    } catch (error) {
      const errorMessage = `${error instanceof Error ? error.message : 'Unknown issue.'}`
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    email,
    isDisabled,
    countdown,
    otp,
    error,
    inputRefs,
    handleOtpChange,
    handleSubmit,
    loading,
    isButtonDisabled,
    resendOtpHandler
  }
}
