import { confirmSignUp, signUp } from 'aws-amplify/auth'
import { RegisterCredential } from './register/hooks/useRegister'

export const registerUser = async(registerInfo: RegisterCredential): Promise<boolean> => {
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
    throw Error('Error signing up:', error)
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
    throw Error('Error signing up:', error)
  }
}
