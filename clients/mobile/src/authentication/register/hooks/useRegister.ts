/* eslint-disable no-console */
import { useMemo, useState } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { validateRequired, validateEmail, validatePhoneNumber, ValidationRule, validateInput } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { RegisterScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import { googleLogin, facebookLogin } from '../../services/authService'
import { formatPhoneNumber } from '../../../utility/formatte'
import { useAuth } from '../../context/useAuth'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import registerUserDeviceForNotification from '../../../utility/deviceRegistration'
import { checkUserProfile } from '../../../userWorkflow/services/userProfileService'

type CredentialKeys = keyof RegisterCredential

export interface RegisterCredential {
  name: string;
  email: string;
  phoneNumber: string;
}

interface RegisterErrors extends RegisterCredential {}

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  name: [validateRequired],
  email: [validateRequired, validateEmail],
  phoneNumber: [validateRequired, validatePhoneNumber]
}

export const useRegister = (): any => {
  const fetchClient = useFetchClient()
  const auth = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)
  const navigation = useNavigation<RegisterScreenNavigationProp>()
  const [registerCredential, setRegisterCredential] = useState<RegisterCredential>(
    initializeState<RegisterCredential>(Object.keys(validationRules) as Array<keyof RegisterCredential>, '')
  )
  const [errors, setErrors] = useState<RegisterErrors>(initializeState<RegisterCredential>(
    Object.keys(validationRules) as Array<keyof RegisterCredential>, '')
  )
  const [socialLoginError, setSocialLoginError] = useState<string>('')

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

  const isButtonDisabled = useMemo(() => {
    return !(
      Object.values(registerCredential).every(value => value !== '') &&
      Object.values(errors).every(error => error === null)
    )
  }, [registerCredential, errors])

  const handleRegister = async(): Promise<void> => {
    navigation.navigate(SCREENS.SET_PASSWORD, {
      routeParams: {
        ...registerCredential,
        phoneNumber: formatPhoneNumber(registerCredential.phoneNumber),
        password: ''
      },
      fromScreen: SCREENS.REGISTER
    })
  }

  const checkProfileAndNavigate = async(): Promise<void> => {
    try {
      const userProfile = await checkUserProfile(fetchClient)
      // eslint-disable-next-line no-console
      console.log('useLogin userProfile', userProfile)
      const hasProfile = Boolean(userProfile?.bloodGroup)
      // eslint-disable-next-line no-console
      console.log('useLogin hasProfile', hasProfile)

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: hasProfile ? SCREENS.BOTTOM_TABS : SCREENS.ADD_PERSONAL_INFO
          }]
        })
      )
    } catch (profileError) {
      // eslint-disable-next-line no-console
      console.error('Error checking profile:', profileError)
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
    errors,
    googleLoading,
    facebookLoading,
    registerCredential,
    handleInputChange,
    isButtonDisabled,
    handleRegister,
    handleGoogleSignIn,
    handleFacebookSignIn,
    socialLoginError
  }
}
