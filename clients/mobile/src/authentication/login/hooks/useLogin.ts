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
import { useUserProfile } from '../../../userWorkflow/context/UserProfileContext'
import { LoadingState } from '../../types/auth'

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
  const { userProfile } = useUserProfile()
  const { setIsAuthenticated } = useAuth()
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
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
      setLoadingState('login')
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
        setLoginError('User is not confirmed. Please verify your email.')
        setLoadingState('idle')
      }
    } catch (error) {
      setLoginError('Invalid Email or Password.')
    } finally {
      setLoadingState('idle')
    }
  }

  const handleSocialSignIn = async(loginFunction: () => Promise<void>, socialMedia: string): Promise<void> => {
    try {
      setLoadingState(socialMedia.toLowerCase() as LoadingState)
      await loginFunction()
      setIsAuthenticated(true)
      registerUserDeviceForNotification(fetchClient)
      const hasProfile = Boolean(userProfile?.bloodGroup)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: hasProfile ? SCREENS.BOTTOM_TABS : SCREENS.ADD_PERSONAL_INFO }]
        })
      )
    } catch (error) {
      setSocialLoginError(`${socialMedia} login failed. Please try again.`)
    } finally {
      setLoadingState('idle')
    }
  }

  const handleGoogleSignIn = async(): Promise<void> => {
    await handleSocialSignIn(googleLogin, 'Google')
  }

  const handleFacebookSignIn = async(): Promise<void> => {
    await handleSocialSignIn(facebookLogin, 'Facebook')
  }

  return {
    loadingState,
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
