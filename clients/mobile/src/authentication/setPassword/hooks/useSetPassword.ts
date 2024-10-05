import { useMemo, useState } from 'react'
import { validateRequired, validatePassword, ValidationRule, validateInput } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SetPasswordRouteProp, SetPasswordScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import { registerUser } from '../../authService'

export const PASSWORD_INPUT_NAME = 'password'

type CredentialKeys = keyof Password

export interface Password {
  password: string;
  confirmPassword: string;
}

interface SetPasswordErrors extends Password {}

const validationRules: Record<CredentialKeys, ValidationRule[]> = {
  password: [validateRequired, validatePassword],
  confirmPassword: [validateRequired, validatePassword]
}

export const useSetPassword = (): any => {
  const navigation = useNavigation<SetPasswordScreenNavigationProp>()
  const { params: routeParams } = useRoute<SetPasswordRouteProp>()
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
    let errorMsg = null
    if (name === PASSWORD_INPUT_NAME) {
      errorMsg = validateInput(value, validationRules[name])
    } else {
      errorMsg = (newPassword.password !== value) ? 'Passwords do not match.' : null
    }

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

  const handleSetPassword = async(): Promise<void> => {
    const { params } = routeParams
    try {
      const isSuccess = await registerUser({ ...params, password: newPassword.password })
      if (isSuccess) {
        navigation.navigate(SCREENS.OTP, { email: params.email })
      }
    } catch (error) {
      console.log(error)
      setError('Failed to sign up. Please try again later.')
    }
  }

  return {
    newPassword,
    setNewPassword,
    handleInputChange,
    handleSetPassword,
    errors,
    error,
    isButtonDisabled
  }
}
