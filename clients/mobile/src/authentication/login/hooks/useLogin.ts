import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation, CommonActions } from '@react-navigation/native'
import type { ValidationRule } from '../../../utility/validator'
import { validateRequired } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import type { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { loginUser } from '../../services/authService'
import { SCREENS } from '../../../setup/constant/screens'
import { useAuth } from '../../context/useAuth'
import registerUserDeviceForNotification from '../../../utility/deviceRegistration'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { useSocialAuth } from '../../socialAuth/hooks/useSocialAuth'

type CredentialKeys = keyof LoginCredential

export type LoginCredential = {
  email: string;
  password: string;
}

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  email: [validateRequired],
  password: [validateRequired]
}

export const useLogin = (): unknown => {
  const { t } = useTranslation()
  const fetchClient = useFetchClient()
  const { setIsAuthenticated } = useAuth()
  const [loginLoading, setLoginLoading] = useState(false)
  const navigation = useNavigation<LoginScreenNavigationProp>()
  const [loginCredential, setLoginCredential] = useState<LoginCredential>(
    initializeState<LoginCredential>(
      Object.keys(validationRules) as Array<keyof LoginCredential>,
      ''
    )
  )

  const [loginError, setLoginError] = useState<string>('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const {
    socialLoading,
    socialLoginError,
    handleGoogleSignIn,
    handleFacebookSignIn
  } = useSocialAuth()

  const handleInputChange = (name: CredentialKeys, value: string): void => {
    setLoginCredential(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleLogin = async(): Promise<void> => {
    try {
      setLoginLoading(true)
      const isSignedIn = await loginUser(loginCredential.email, loginCredential.password)
      if (isSignedIn) {
        setIsAuthenticated(true)
        registerUserDeviceForNotification(fetchClient)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: SCREENS.BOTTOM_TABS }]
          })
        )
      } else {
        setLoginError(t('error.userNotConfirmed'))
        setLoginLoading(false)
      }
    } catch (error) {
      setLoginError(t('error.invalidEmailOrPassword'))
    } finally {
      setLoginLoading(false)
    }
  }

  return {
    loginLoading,
    loginError,
    loginCredential,
    handleInputChange,
    isPasswordVisible,
    setIsPasswordVisible,
    handleLogin,
    socialLoading,
    socialLoginError,
    handleGoogleSignIn,
    handleFacebookSignIn
  }
}
