import { useState, useRef } from 'react'
import { TextInput } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { OtpScreenNavigationProp, OtpScreenRouteProp } from '../../../navigation/navigationTypes'

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

  const handleSubmit = (): void => {
    setError(true)
    // navigation.replace('OTP')
    console.log('SUBMIT')
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
