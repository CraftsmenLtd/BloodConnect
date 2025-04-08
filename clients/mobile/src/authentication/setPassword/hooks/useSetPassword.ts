import { useMemo, useState } from 'react'
import type { ValidationRule} from '../../../utility/validator';
import { validateRequired, validatePassword, validateInput } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { SetPasswordRouteProp, SetPasswordScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import type { UserRegistrationCredentials } from '../../services/authService';
import { confirmResetPasswordHandler, registerUser } from '../../services/authService'

export const PASSWORD_INPUT_NAME = 'password'

type CredentialKeys = keyof Password
type errorMessageType = string | null

export type Password = {
  password: string;
  confirmPassword: string;
}

type SetPasswordErrors = Password

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  password: [validateRequired, validatePassword],
  confirmPassword: [validateRequired, validatePassword]
}

export const useSetPassword = (): unknown => {
  const navigation = useNavigation<SetPasswordScreenNavigationProp>()
  const [loading, setLoading] = useState(false)
  const route = useRoute<SetPasswordRouteProp>()
  const { routeParams, fromScreen } = route.params
  const [newPassword, setNewPassword] = useState<Password>(
    initializeState<Password>(Object.keys(validationRules) as Array<keyof Password>, '')
  )

  const [errors, setErrors] = useState<SetPasswordErrors>(initializeState<Password>(
    Object.keys(validationRules) as Array<keyof Password>, '')
  )

  const [error, setError] = useState<string>('')

  const handleInputChange = (name: keyof Password, value: string): void => {
    setNewPassword((prev) => ({
      ...prev,
      [name]: value
    }))
    handleInputValidation(name, value)
  }

  const handleInputValidation = (name: CredentialKeys, value: string): void => {
    const errorMsg: errorMessageType = name === PASSWORD_INPUT_NAME
      ? validateInput(value, validationRules[name])
      : (newPassword.password !== value ? 'Passwords do not match.' : null)

    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMsg
    }))
  }

  const isButtonDisabled = useMemo(() => {
    return !(
      Object.values(newPassword).every(value => value !== '') &&
      Object.values(errors).every(error => error === null)
    )
  }, [newPassword, errors])

  const handleRegister = async(): Promise<void> => {
    const isSuccess = await registerUser({ ...(routeParams as UserRegistrationCredentials), password: newPassword.password })
    if (isSuccess) {
      navigation.navigate(SCREENS.OTP, { email: routeParams.email, password: newPassword.password, fromScreen: SCREENS.SET_PASSWORD })
    }
  }

  const handleSetPassword = async(): Promise<void> => {
    setLoading(true)
    try {
      if (fromScreen === SCREENS.REGISTER) {
        await handleRegister()
      } else {
        const isPasswordResetDone = await confirmResetPasswordHandler(
          routeParams.email,
          'otp' in routeParams ? routeParams.otp : '',
          newPassword.password
        )
        if (isPasswordResetDone) {
          navigation.navigate(SCREENS.LOGIN)
        }
      }
    } catch (error) {
      const errorMessage = `${error instanceof Error ? error.message : 'Unknown issue.'}`
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    newPassword,
    setNewPassword,
    handleInputChange,
    handleSetPassword,
    errors,
    error,
    isButtonDisabled,
    loading
  }
}
