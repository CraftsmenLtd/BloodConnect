import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { isRequired, isValidEmail, isValidPassword, ValidationRule } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { loginUser } from '../../authService'

type CredentialKeys = keyof LoginCredential

export interface LoginCredential {
  email: string;
  password: string;
}

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  email: [isRequired, isValidEmail],
  password: [isRequired, isValidPassword]
}

export const useLogin = (): any => {
  const navigation = useNavigation<LoginScreenNavigationProp>()
  const [loginCredential, setLoginCredential] = useState<LoginCredential>(
    initializeState<LoginCredential>(Object.keys(validationRules) as Array<keyof LoginCredential>, '')
  )

  const [loginError, setLoginError] = useState<string>('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const handleInputChange = (name: CredentialKeys, value: string): void => {
    setLoginCredential(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleLogin = async(): Promise<void> => {
    try {
      const isLoginSucess = await loginUser(loginCredential.email, loginCredential.password)
      if (isLoginSucess) {
        navigation.navigate('Profile')
      }
    } catch (error) {
      setLoginError('Invalid Email or Password.')
    }
  }

  return {
    loginError,
    loginCredential,
    handleInputChange,
    isPasswordVisible,
    setIsPasswordVisible,
    handleLogin
  }
}
