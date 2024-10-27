import { useState, useRef, useMemo } from 'react'
import { TextInput } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { OtpScreenNavigationProp, OtpScreenRouteProp } from '../../../setup/navigation/navigationTypes'
import { submitOtp, loginUser } from '../../services/authService'
import { SCREENS } from '../../../setup/constant/screens'
import { useAuth } from '../../context/useAuth'

export const useOtp = (): any => {
  const auth = useAuth()
  const navigation = useNavigation<OtpScreenNavigationProp>()
  const route = useRoute<OtpScreenRouteProp>()
  const { email, password } = route.params
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string>('')
  const inputRefs = useRef<Array<TextInput | null>>([])

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

  const isButtonDisabled = useMemo(() => {
    return otp.join('').trim().length !== 6
  }, [otp])

  const handleSubmit = async(): Promise<void> => {
    setLoading(true)
    try {
      const isSucessRegister = await submitOtp(email, otp.join(''))
      if (isSucessRegister) {
        const isSignedIn = await loginUser(email, password)
        if (isSignedIn) {
          auth?.setIsAuthenticated(true)
          navigation.navigate(SCREENS.BOTTOM_TABS)
        } else {
          navigation.navigate(SCREENS.LOGIN)
        }
      } else {
        setError('Verification incomplete. Please follow further steps.')
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
    otp,
    error,
    inputRefs,
    handleOtpChange,
    handleSubmit,
    loading,
    isButtonDisabled
  }
}
