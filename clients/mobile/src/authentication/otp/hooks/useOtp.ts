import { useState, useRef } from 'react'
import { TextInput } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { OtpScreenNavigationProp, OtpScreenRouteProp } from '../../../setup/navigation/navigationTypes'
import { submitOtp } from '../../authService'

export const useOtp = (): any => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigation = useNavigation<OtpScreenNavigationProp>()
  const route = useRoute<OtpScreenRouteProp>()
  const { email } = route.params

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

  const handleSubmit = async(): Promise<void> => {
    try {
      const isSignUpComplete = await submitOtp(email, otp.join(''))
      console.log('SIGN UP DONE', isSignUpComplete)
    } catch (error) {
      setError(true)
    }
  }

  return {
    email,
    otp,
    error,
    inputRefs,
    handleOtpChange,
    handleSubmit
  }
}
