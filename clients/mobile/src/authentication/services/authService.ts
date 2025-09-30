import type { JwtPayload } from '@aws-amplify/core/internals/utils'
import type {
  AuthSession,
  ResetPasswordOutput
} from 'aws-amplify/auth'
import {
  confirmResetPassword,
  confirmSignUp,
  decodeJWT,
  fetchAuthSession,
  resendSignUpCode,
  resetPassword,
  signIn,
  signInWithRedirect,
  signOut,
  signUp
} from 'aws-amplify/auth'
import { TOKEN } from '../../setup/constant/token'
import StorageService from '../../utility/storageService'
import { handleAuthError } from './authErrorHandler'

export type User = {
  email: string;
  userId: string;
  phoneNumber: string;
  name: string;
}

export type UserRegistrationCredentials = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

type FetchSessionResponse = {
  accessToken: string | undefined;
  idToken: string | undefined;
}

export const decodeAccessToken = (token: string | null): JwtPayload => {
  if (token === null) {
    throw new Error('Token Can\'t be null.')
  }
  const { payload } = decodeJWT(token)

  return payload
}

export const loadTokens = async():
  Promise<{
  storedAccessToken: string | undefined;
  storedIdToken: string | undefined;
}> => {
  try {
    const session = await fetchSession()

    return { storedAccessToken: session.accessToken, storedIdToken: session.idToken }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Failed to load tokens.')
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
      return { accessToken: undefined, idToken: undefined }
    }

    const accessToken = session.tokens.accessToken?.toString()
    const idToken = session.tokens.idToken?.toString()

    return { accessToken, idToken }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Failed to fetch session')
  }
}

export const currentLoggedInUser = async(): Promise<User> => {
  const session: AuthSession = await fetchAuthSession()
  if (session?.tokens === undefined) {
    throw new Error('Session or tokens are undefined')
  }

  return {
    email: session.tokens.idToken?.payload.email as string,
    userId: session.tokens.idToken?.payload['custom:userId'] as string,
    phoneNumber: session.tokens.idToken?.payload.phone_number as string,
    name: session.tokens.idToken?.payload.name as string
  } satisfies User
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
    throw new Error(
      `Error logging in user: ${error instanceof Error ? error.message : error}`
    )
  }
}

export const googleLogin = async(): Promise<void> => {
  try {
    await signInWithRedirect({ provider: 'Google' })
    await fetchSession()
  } catch (error) {
    throw new Error(
      `Error logging with google: ${error instanceof Error ? error.message : error}`
    )
  }
}

export const facebookLogin = async(): Promise<void> => {
  try {
    await signInWithRedirect({ provider: 'Facebook' })
    await fetchSession()
  } catch (error) {
    throw new Error(
      `Error logging with facebook: ${error instanceof Error ? error.message : error}`
    )
  }
}

export const resetPasswordHandler = async(
  email: string
): Promise<ResetPasswordOutput['nextStep']> => {
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

export const confirmResetPasswordHandler = async(
  email: string,
  otp: string,
  password: string
): Promise<boolean> => {
  try {
    await confirmResetPassword({ username: email, confirmationCode: otp, newPassword: password })

    return true
  } catch (error) {
    const errorMessage = handleConfirmPasswordError(error)
    throw new Error(errorMessage)
  }
}

export const resendSignUpOtp = async(email: string): Promise<boolean> => {
  try {
    const response = await resendSignUpCode({ username: email })

    return response.destination !== ''
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
  decodeAccessToken,
  currentLoggedInUser
}
