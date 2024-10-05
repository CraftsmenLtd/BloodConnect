import { confirmSignUp, signUp, signIn } from 'aws-amplify/auth'

export interface UserRegistrationCredentials {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
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

export const submitOtp = async(email: string, otp: string): Promise<boolean> => {
  try {
    const { nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: otp
    })
    return nextStep.signUpStep === 'DONE'
  } catch (error) {
    throw new Error(`Error confirming sign-up with OTP: ${error instanceof Error ? error.message : error}`)
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
