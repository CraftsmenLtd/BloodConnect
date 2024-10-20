import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { validateRequired, ValidationRule } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { loginUser, googleLogin, facebookLogin } from '../../authService'
import { SCREENS } from '../../../setup/constant/screens'

type CredentialKeys = keyof LoginCredential

export interface LoginCredential {
  email: string;
  password: string;
}

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  email: [validateRequired],
  password: [validateRequired]
}

export const useLogin = (): any => {
  const navigation = useNavigation<LoginScreenNavigationProp>()
  const [loginCredential, setLoginCredential] = useState<LoginCredential>(
    initializeState<LoginCredential>(Object.keys(validationRules) as Array<keyof LoginCredential>, '')
  )

  const [loginError, setLoginError] = useState<string>('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [socialLoginError, setSocialLoginError] = useState<string>('')

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
        navigation.navigate(SCREENS.PROFILE)
      }
    } catch (error) {
      setLoginError('Invalid Email or Password.')
    }
  }

  const handleGoogleSignIn = async(): Promise<void> => {
    try {
      await googleLogin()
      navigation.navigate(SCREENS.PROFILE)
    } catch (error) {
      setSocialLoginError('Failed to sign in with Google.')
    }
  }

  const handleFacebookSignIn = async(): Promise<void> => {
    try {
      await facebookLogin()
      navigation.navigate(SCREENS.PROFILE)
    } catch (error) {
      setSocialLoginError('Failed to sign in with Facebook.')
    }
  }

  return {
    loginError,
    loginCredential,
    handleInputChange,
    isPasswordVisible,
    setIsPasswordVisible,
    handleLogin,
    handleGoogleSignIn,
    handleFacebookSignIn,
    socialLoginError
  }
}
