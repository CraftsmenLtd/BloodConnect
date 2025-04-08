import { useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { ValidationRule} from '../../../utility/validator';
import { validateRequired, validateEmail, validatePhoneNumber, validateInput } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import type { RegisterScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import { formatPhoneNumber } from '../../../utility/formatting'
import { useSocialAuth } from '../../socialAuth/hooks/useSocialAuth'

type CredentialKeys = keyof RegisterCredential

export type RegisterCredential = {
  name: string;
  email: string;
  phoneNumber: string;
}

type RegisterErrors = RegisterCredential

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  name: [validateRequired],
  email: [validateRequired, validateEmail],
  phoneNumber: [validateRequired, validatePhoneNumber]
}

export const useRegister = (): unknown => {
  const navigation = useNavigation<RegisterScreenNavigationProp>()
  const [registerCredential, setRegisterCredential] = useState<RegisterCredential>(
    initializeState<RegisterCredential>(Object.keys(validationRules) as Array<keyof RegisterCredential>, '')
  )
  const [errors, setErrors] = useState<RegisterErrors>(initializeState<RegisterCredential>(
    Object.keys(validationRules) as Array<keyof RegisterCredential>, '')
  )

  const { socialLoading, socialLoginError, handleGoogleSignIn, handleFacebookSignIn } = useSocialAuth()

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

  return {
    errors,
    registerCredential,
    handleInputChange,
    isButtonDisabled,
    handleRegister,
    socialLoading,
    socialLoginError,
    handleGoogleSignIn,
    handleFacebookSignIn
  }
}
