import { useState } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { validateRequired, ValidationRule } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { loginUser, googleLogin, facebookLogin } from '../../services/authService'
import { SCREENS } from '../../../setup/constant/screens'
import { useAuth } from '../../context/useAuth'
import registerUserDeviceForNotification from '../../../utility/deviceRegistration'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { checkUserProfile } from '../../../userWorkflow/services/userProfileService'
import { ProfileError } from '../../../utility/errors'

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
  const [loginLoading, setLoginLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)
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
      setLoginLoading(true)
      const isSignedIn = await loginUser(loginCredential.email, loginCredential.password)
      if (isSignedIn) {
        auth?.setIsAuthenticated(true)
        registerUserDeviceForNotification(fetchClient)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: SCREENS.BOTTOM_TABS }]
          })
        )
      } else {
        setLoginError('User is not confirmed. Please verify your email.')
        setLoginLoading(false)
      }
    } catch (error) {
      setLoginError('Invalid Email or Password.')
    } finally {
      setLoginLoading(false)
    }
  }

  const checkProfileAndNavigate = async(): Promise<void> => {
    try {
      const userProfile = await checkUserProfile(fetchClient)
      const hasProfile = Boolean(userProfile?.bloodGroup)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: hasProfile ? SCREENS.BOTTOM_TABS : SCREENS.ADD_PERSONAL_INFO
          }]
        })
      )
    } catch (error) {
      if (error instanceof ProfileError) {
        setSocialLoginError('Unable to check profile. Please try again.')
      } else {
        setSocialLoginError('An unexpected error occurred.')
      }
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: SCREENS.ADD_PERSONAL_INFO }]
        })
      )
    }
  }

  const handleGoogleSignIn = async(): Promise<void> => {
    try {
      setGoogleLoading(true)
      const isGoogleSignedIn = await googleLogin()
      if (isGoogleSignedIn) {
        auth?.setIsAuthenticated(true)
        registerUserDeviceForNotification(fetchClient)
        await checkProfileAndNavigate()
      } else {
        setSocialLoginError('Google login failed. Please try again.')
      }
    } catch (error) {
      setSocialLoginError('Failed to sign in with Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleFacebookSignIn = async(): Promise<void> => {
    try {
      setFacebookLoading(true)
      const isFacebookSignedIn = await facebookLogin()
      if (isFacebookSignedIn) {
        auth?.setIsAuthenticated(true)
        registerUserDeviceForNotification(fetchClient)
        await checkProfileAndNavigate()
      } else {
        setSocialLoginError('Facebook login failed. Please try again.')
      }
    } catch (error) {
      setSocialLoginError('Failed to sign in with Facebook.')
    } finally {
      setFacebookLoading(false)
    }
  }

  return {
    loginError,
    loginLoading,
    googleLoading,
    facebookLoading,
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
