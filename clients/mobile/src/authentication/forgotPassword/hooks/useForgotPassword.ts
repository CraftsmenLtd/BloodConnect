import { useMemo, useState } from 'react'
import { resetPasswordHandler } from '../../services/authService'
import { useNavigation } from '@react-navigation/native'
import { validateRequired, validateEmail, ValidationRule, validateInput } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { ForgotPasswordScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'

type ForgotPasswordFields = keyof ForgotPasswordCredentials

export interface ForgotPasswordCredentials {
  email: string;
}

interface ForgotPasswordErrors {
  email: string | null;
}

const validationRules: Record<ForgotPasswordFields, ValidationRule[]> = {
  email: [validateRequired, validateEmail]
}

export const useForgotPassword = (): any => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>()
  const [credentials, setCredentials] = useState<ForgotPasswordCredentials>(
    initializeState<ForgotPasswordCredentials>(Object.keys(validationRules) as ForgotPasswordFields[], '')
  )
  const [errors, setErrors] = useState<ForgotPasswordErrors>(
    initializeState<ForgotPasswordCredentials>(Object.keys(validationRules) as ForgotPasswordFields[], null)
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (name: ForgotPasswordFields, value: string): void => {
    setCredentials(prevState => ({
      ...prevState,
      [name]: value
    }))
    handleInputValidation(name, value)
  }

  const handleInputValidation = (name: ForgotPasswordFields, value: string): void => {
    const errorMsg = validateInput(value, validationRules[name])
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMsg
    }))
  }

  const isButtonDisabled = useMemo(() => {
    return !(
      Object.values(credentials).every(value => value !== '') &&
      Object.values(errors).every(error => error === null)
    )
  }, [credentials, errors])

  const handleForgotPassword = async(): Promise<void> => {
    setLoading(true)
    try {
      const nextStep = await resetPasswordHandler(credentials.email)
      switch (nextStep.resetPasswordStep) {
        case 'CONFIRM_RESET_PASSWORD_WITH_CODE':
          navigation.navigate(SCREENS.OTP, { email: credentials.email, password: '', fromScreen: SCREENS.FORGOT_PASSWORD })
          break
        case 'DONE':
          setError('Password reset process already completed.')
          break
        default:
          setError('Password reset failed. Check your email or try again.')
      }
    } catch (error) {
      const errorMessage = `${error instanceof Error ? error.message : 'Unknown issue.'}`
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    errors,
    credentials,
    handleInputChange,
    isButtonDisabled,
    handleForgotPassword
  }
}
