import { useState } from 'react'
import { isRequired, isValidEmail, isValidPassword, isValidPhoneNumber, ValidationRule, validateInput } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
// import { registerUser } from '../services/authService'
// import { useNavigation } from '@react-navigation/native'

type CredentialKeys = keyof RegisterCredential

interface RegisterCredential {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface RegisterErrors extends RegisterCredential {}

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  name: [isRequired],
  email: [isRequired, isValidEmail],
  phoneNumber: [isRequired, isValidPhoneNumber],
  password: [isRequired, isValidPassword]
}

export const useRegister = (): any => {
  const [registerCredential, setRegisterCredential] = useState<RegisterCredential>(
    initializeState<RegisterCredential>(Object.keys(validationRules) as Array<keyof RegisterCredential>, '')
  )
  const [errors, setErrors] = useState<RegisterErrors>(initializeState<RegisterCredential>(
    Object.keys(validationRules) as Array<keyof RegisterCredential>, '')
  )
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  // const navigation = useNavigation()

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
    console.log('REGISTER')
  }

  return {
    errors,
    registerCredential,
    handleInputChange,
    isPasswordVisible,
    setIsPasswordVisible,
    handleRegister
  }
}
