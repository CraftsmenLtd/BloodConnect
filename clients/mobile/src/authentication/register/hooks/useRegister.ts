import { useMemo, useState } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { validateRequired, validateEmail, validatePhoneNumber, ValidationRule, validateInput } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { RegisterScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import { googleLogin, facebookLogin } from '../../services/authService'
import { useAuth } from '../../context/useAuth'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import registerUserDeviceForNotification from '../../../utility/deviceRegistration'
import { formatPhoneNumber } from '../../../utility/formatting'
import { useUserProfile } from '../../../userWorkflow/context/UserProfileContext'

type CredentialKeys = keyof RegisterCredential

export interface RegisterCredential {
  name: string;
  email: string;
  phoneNumber: string;
}

interface RegisterErrors extends RegisterCredential { }

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  name: [validateRequired],
  email: [validateRequired, validateEmail],
  phoneNumber: [validateRequired, validatePhoneNumber]
}

export const useRegister = (): any => {
  const fetchClient = useFetchClient()
  const { userProfile, fetchUserProfile } = useUserProfile()
  const { setIsAuthenticated } = useAuth()
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

  const handleSocialSignIn = async(loginFunction: () => Promise<void>, socialMedia: string): Promise<void> => {
    try {
      await loginFunction()
      setIsAuthenticated(true)
      registerUserDeviceForNotification(fetchClient)
      // const userProfile = await fetchUserProfile()
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
