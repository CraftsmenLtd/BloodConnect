import { confirmSignUp, signUp, signIn, signInWithRedirect, signOut, decodeJWT, AuthSession, fetchAuthSession, resetPassword, confirmResetPassword, ResetPasswordOutput } from 'aws-amplify/auth'
import { JwtPayload } from '@aws-amplify/core/internals/utils'
import StorageService from '../../utility/storageService'
import { handleAuthError } from './authErrorHandler'
import { TOKEN } from '../../setup/constant/token'
export interface UserRegistrationCredentials {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface FetchSessionResponse {
  accessToken: string;
  idToken: string;
}

export const decodeAccessToken = (token: string | null): JwtPayload => {
  if (token === null) {
    throw new Error('Token Can\'t be null.')
  }
  const { payload } = decodeJWT(token)
  return payload
}

export const loadTokens = async(): Promise<{ storedAccessToken: string | null; storedIdToken: string | null }> => {
  try {
    const storedAccessToken = await StorageService.getItem<string>(TOKEN.ACCESS_TOKEN)
    const storedIdToken = await StorageService.getItem<string>(TOKEN.ID_TOKEN)

    const payload = decodeAccessToken(storedIdToken)

    if (payload.exp !== undefined && payload.exp < Math.floor(Date.now() / 1000)) {
      const session = await fetchSession()
      return { storedAccessToken: session.accessToken, storedIdToken: session.idToken }
    } else {
      return { storedAccessToken, storedIdToken }
    }
  } catch (error) {
    throw new Error('Failed to load tokes.')
  }
}

export const logoutUser = async(): Promise<void> => {
  try {
    await signOut()
    await StorageService.removeItem(TOKEN.ACCESS_TOKEN)
    await StorageService.removeItem(TOKEN.ID_TOKEN)
  } catch (error) {
    const errorMessage = handleAuthError(error)
    throw new Error(errorMessage)
  }
}

export const registerUser = async(registerInfo: UserRegistrationCredentials): Promise<boolean> => {
  try {
    const { nextStep } = await signUp({
      username: registerInfo.email,
      password: registerInfo.password,
      options: {
        userAttributes: {
          email: registerInfo.email,
          name: registerInfo.name,
          phone_number: registerInfo.phoneNumber
        }
      }

    })
    return nextStep.signUpStep === 'CONFIRM_SIGN_UP'
  } catch (error) {
    const errorMessage = handleAuthError(error)
    throw new Error(errorMessage)
  }
}

export const submitOtp = async(email: string, otp: string): Promise<boolean> => {
  try {
    const { nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: otp
    })
    return nextStep.signUpStep === 'DONE'
  } catch (error) {
    const errorMessage = handleAuthError(error)
    throw new Error(errorMessage)
  }
}

export const fetchSession = async(): Promise<FetchSessionResponse> => {
  try {
    const session: AuthSession = await fetchAuthSession()
    if (session?.tokens === undefined) {
      throw new Error('Session or tokens are undefined')
    }

    const accessToken = session.tokens.accessToken?.toString()
    const idToken = session.tokens.idToken?.toString()

    if (accessToken === undefined || idToken === undefined) {
      throw new Error('Access token or ID token is missing')
    }

    await StorageService.storeItem<string>(TOKEN.ACCESS_TOKEN, accessToken)
    await StorageService.storeItem<string>(TOKEN.ID_TOKEN, idToken)
    return { accessToken, idToken }
  } catch (error) {
    throw new Error('Failed to fetch session')
  }
}

export const loginUser = async(email: string, password: string): Promise<boolean> => {
  try {
    const { isSignedIn } = await signIn({
      username: email,
      password,
      options: {
        authFlowType: 'USER_PASSWORD_AUTH'
      }
    })
    return isSignedIn
  } catch (error) {
    throw new Error(`Error logging in user: ${error instanceof Error ? error.message : error}`)
  }
}

export const googleLogin = async(): Promise<void> => {
  try {
    await signInWithRedirect({ provider: 'Google' })
  } catch (error) {
    throw new Error(`Error logging with google: ${error instanceof Error ? error.message : error}`)
  }
}

export const facebookLogin = async(): Promise<void> => {
  try {
    await signInWithRedirect({ provider: 'Facebook' })
  } catch (error) {
    throw new Error(`Error logging with facebook: ${error instanceof Error ? error.message : error}`)
  }
}

export const resetPasswordHandler = async(email: string): Promise<ResetPasswordOutput['nextStep']> => {
  try {
    const { nextStep } = await resetPassword({ username: email })
    return nextStep
  } catch (error) {
    const errorMessage = handleAuthError(error)
    throw new Error(errorMessage)
  }
}

const handleConfirmPasswordError = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('Invalid verification code')) {
      return 'Invalid confirmation code. Please try again.'
    } else if (error.message.includes('Password does not satisfy policy')) {
      return 'Password does not meet requirements. Please choose a different password.'
    } else {
      return 'Reset failed. Please try again.'
    }
  } else {
    return 'An unexpected error occurred. Please try again.'
  }
}

export const confirmResetPasswordHandler = async(email: string, otp: string, password: string): Promise<boolean> => {
  try {
    await confirmResetPassword({ username: email, confirmationCode: otp, newPassword: password })
    return true
  } catch (error) {
    const errorMessage = handleConfirmPasswordError(error)
    throw new Error(errorMessage)
  }
}

export default {
  loadTokens,
  loginUser,
  logoutUser,
  fetchSession,
  decodeAccessToken
}
