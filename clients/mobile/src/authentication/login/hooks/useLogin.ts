import { useState } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { validateRequired, ValidationRule } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { loginUser, googleLogin, facebookLogin } from '../../services/authService'
import { SCREENS } from '../../../setup/constant/screens'
import { useAuth } from '../../context/useAuth'
import { registerForPushNotificationsAsync, saveDeviceTokenToSNS } from '../../../setup/notification/Notification'
import { useFetchClient } from '../../../setup/clients/useFetchClient'

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
  const fetchClient = useFetchClient()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
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

  const registerUserDeviceForNotification = (): void => {
    registerForPushNotificationsAsync().then(token => {
      void saveDeviceTokenToSNS(token as string, fetchClient)
    }).catch(error => { console.error(error) })
  }

  const handleLogin = async(): Promise<void> => {
    try {
      setLoading(true)
      const isSignedIn = await loginUser(loginCredential.email, loginCredential.password)
      if (isSignedIn) {
        auth?.setIsAuthenticated(true)
        registerUserDeviceForNotification()
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: SCREENS.BOTTOM_TABS }]
          })
        )
      } else {
        setLoginError('User is not confirmed. Please verify your email.')
        setLoading(false)
      }
    } catch (error) {
      setLoginError('Invalid Email or Password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async(): Promise<void> => {
    try {
      await googleLogin()
      registerUserDeviceForNotification()
      navigation.navigate(SCREENS.PROFILE)
    } catch (error) {
      setSocialLoginError('Failed to sign in with Google.')
    }
  }

  const handleFacebookSignIn = async(): Promise<void> => {
    try {
      await facebookLogin()
      registerUserDeviceForNotification()
      navigation.navigate(SCREENS.PROFILE)
    } catch (error) {
      setSocialLoginError('Failed to sign in with Facebook.')
    }
  }

  return {
    loginError,
    loading,
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
