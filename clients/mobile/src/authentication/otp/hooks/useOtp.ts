import { useState, useRef, useMemo } from 'react'
import { TextInput } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { OtpScreenNavigationProp, OtpScreenRouteProp } from '../../../setup/navigation/navigationTypes'
import { submitOtp } from '../../authService'
import { SCREENS } from '../../../setup/constant/screens'
import { useAuth } from '../../useAuth'

export const useOtp = (): any => {
  const auth = useAuth()
  const navigation = useNavigation<OtpScreenNavigationProp>()
  const route = useRoute<OtpScreenRouteProp>()
  const { email } = route.params
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<boolean>(false)
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
      const { isSucessRegister, accessToken, idToken } = await submitOtp(email, otp.join(''))
      if (isSucessRegister) {
        auth?.setAccessToken(accessToken)
        auth?.setIdToken(idToken)
        auth?.setIsAuthenticated(true)
        navigation.navigate(SCREENS.PROFILE)
      }
    } catch (error) {
      setError(true)
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
