import { confirmSignUp, signUp, signIn, signInWithRedirect, signOut, decodeJWT, AuthSession, fetchAuthSession } from 'aws-amplify/auth'
import { JwtPayload } from '@aws-amplify/core/internals/utils'
import StorageService from '../utility/storageService'
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
    const storedAccessToken = await StorageService.getItem<string>('accessToken')
    const storedIdToken = await StorageService.getItem<string>('idToken')

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
    await StorageService.removeItem('accessToken')
    await StorageService.removeItem('idToken')
    await StorageService.removeItem('refreshToken')
  } catch (error) {
    throw new Error('Failed to Logout.')
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
    throw new Error(`Error registering user: ${error instanceof Error ? error.message : error}`)
  }
}

export const submitOtp = async(email: string, otp: string): Promise<FetchSessionResponse & { isSucessRegister: boolean }> => {
  try {
    const { nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: otp
    })
    const { accessToken, idToken } = await fetchSession()
    const isSucessRegister = nextStep.signUpStep === 'DONE'
    return { accessToken, idToken, isSucessRegister }
  } catch (error) {
    throw new Error(`Error confirming sign-up with OTP: ${error instanceof Error ? error.message : error}`)
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

    await StorageService.storeItem<string>('accessToken', accessToken)
    await StorageService.storeItem<string>('idToken', idToken)

    return { accessToken, idToken }
  } catch (error) {
    throw new Error('Failed to fetch session')
  }
}

export const loginUser = async(email: string, password: string): Promise<FetchSessionResponse & { isSignedIn: boolean }> => {
  try {
    await signOut()
    const { isSignedIn } = await signIn({
      username: email,
      password,
      options: {
        authFlowType: 'USER_PASSWORD_AUTH'
      }
    })
    const { accessToken, idToken } = await fetchSession()
    return { accessToken, idToken, isSignedIn }
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

export default {
  loadTokens,
  loginUser,
  logoutUser,
  fetchSession,
  decodeAccessToken
}
