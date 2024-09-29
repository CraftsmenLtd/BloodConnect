import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, userSignIn } from '@client-commons/platform/aws/auth/awsAuth'
import useFetchData from '@client-commons/hooks/useFetchData'
import { DashboardPath } from '../../../../constants/routeConsts'

type UseLoginReturn = {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  toastVisible: boolean;
  toastMsg: string;
  toastClass: string;
  loading: boolean;
  showPassword: boolean;
  handleTogglePasswordVisibility: () => void;
  handleLogin: () => Promise<void>;
}

export const useLogin = (): UseLoginReturn => {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [toastVisible, setToastVisible] = useState<boolean>(false)
  const [toastMsg, setToastMsg] = useState<string>('')
  const [toastClass, setToastClass] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const [signIn, loading, , signInError] = useFetchData(userSignIn)
  const [fetchUser, , user] = useFetchData(getUser)

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (user != null) {
      navigate(DashboardPath)
    }
    if (signInError != null) {
      handleError(signInError)
    }
  }, [user, signInError])

  const handleTogglePasswordVisibility = (): void => {
    setShowPassword(!showPassword)
  }

  const handleError = (error: string): void => {
    setToastMsg(error)
    setToastClass('alert-error')
    setToastVisible(true)

    setTimeout(() => {
      setToastVisible(false)
    }, 3000)
  }

  const handleLogin = async(): Promise<void> => {
    try {
      await signIn(email, password)
      navigate(DashboardPath)
    } catch (error: any) {
      handleError(error.message)
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    toastVisible,
    toastMsg,
    toastClass,
    loading,
    showPassword,
    handleTogglePasswordVisibility,
    handleLogin
  }
}
