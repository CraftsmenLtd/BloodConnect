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
  const { userProfile, fetchUserProfile } = useUserProfile()
  const { setIsAuthenticated } = useAuth()
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
        setLoginLoading(false)
      }
    } catch (error) {
      setLoginError('Invalid Email or Password.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSocialSignIn = async(loginFunction: () => Promise<void>, socialMedia: string): Promise<void> => {
    try {
      await loginFunction()
      setIsAuthenticated(true)
      registerUserDeviceForNotification(fetchClient)
      // const userProfile = await fetchUserProfile()
      const hasProfile = Boolean(userProfile?.bloodGroup)
      console.log('hasProfile login', hasProfile)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: hasProfile ? SCREENS.BOTTOM_TABS : SCREENS.ADD_PERSONAL_INFO }]
        })
      )
    } catch (error) {
      setSocialLoginError(`${socialMedia} login failed. Please try again.`)
    } finally {
      setGoogleLoading(false)
      setFacebookLoading(false)
    }
  }

  const handleGoogleSignIn = async(): Promise<void> => {
    setGoogleLoading(true)
    await handleSocialSignIn(googleLogin, 'Google')
  }

  const handleFacebookSignIn = async(): Promise<void> => {
    setFacebookLoading(true)
    await handleSocialSignIn(facebookLogin, 'Facebook')
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
