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

  const handleGoogleSignIn = async(): Promise<void> => {
    try {
      const isGoogleSignedIn = await googleLogin()
      if (isGoogleSignedIn) {
        auth?.setIsAuthenticated(true)
        registerUserDeviceForNotification(fetchClient)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: SCREENS.BOTTOM_TABS }]
          })
        )
      } else {
        setSocialLoginError('Google login failed. Please try again.')
      }
    } catch (error) {
      setSocialLoginError('Failed to sign in with Google.')
    }
  }

  const handleFacebookSignIn = async(): Promise<void> => {
    try {
      const isFacebookSignedIn = await facebookLogin()
      if (isFacebookSignedIn) {
        auth?.setIsAuthenticated(true)
        registerUserDeviceForNotification(fetchClient)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: SCREENS.BOTTOM_TABS }]
          })
        )
      } else {
        setSocialLoginError('Facebook login failed. Please try again.')
      }
    } catch (error) {
      setSocialLoginError('Failed to sign in with Facebook.')
    }
  }

  return {
    errors,
    registerCredential,
    handleInputChange,
    isButtonDisabled,
    handleRegister,
    handleGoogleSignIn,
    handleFacebookSignIn,
    socialLoginError
  }
}
