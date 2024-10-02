import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { validateRequired, validateEmail, validatePassword, validatePhoneNumber, ValidationRule, validateInput } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { RegisterScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { registerUser } from '../../authService'
import { SCREENS } from '../../../setup/constant/screens'

type CredentialKeys = keyof RegisterCredential

export interface RegisterCredential {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface RegisterErrors extends RegisterCredential {}

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  name: [validateRequired],
  email: [validateRequired, validateEmail],
  phoneNumber: [validateRequired, validatePhoneNumber],
  password: [validateRequired, validatePassword]
}

export const useRegister = (): any => {
  const navigation = useNavigation<RegisterScreenNavigationProp>()
  const [registerCredential, setRegisterCredential] = useState<RegisterCredential>(
    initializeState<RegisterCredential>(Object.keys(validationRules) as Array<keyof RegisterCredential>, '')
  )
  const [errors, setErrors] = useState<RegisterErrors>(initializeState<RegisterCredential>(
    Object.keys(validationRules) as Array<keyof RegisterCredential>, '')
  )
  const [signupError, setSignupError] = useState<string>('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const handleInputChange = (name: CredentialKeys, value: string): void => {
    setRegisterCredential(prevState => ({
      ...prevState,
      [name]: value
    }))
    handleInputValidation(name, value)
  }

  const handleInputValidation = (name: CredentialKeys, value: string): void => {
    const errorMsg = validateInput(value, validationRules[name])
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMsg
    }))
  }

  const handleRegister = async(): Promise<void> => {
    try {
      const isConfirmationRequired = await registerUser(registerCredential)
      if (isConfirmationRequired) {
        navigation.navigate(SCREENS.OTP, { email: registerCredential.email })
      }
    } catch (error) {
      setSignupError('Failed to sign up. Please try again later.')
    }
  }

  return {
    signupError,
    errors,
    registerCredential,
    handleInputChange,
    isPasswordVisible,
    setIsPasswordVisible,
    handleRegister
  }
}
