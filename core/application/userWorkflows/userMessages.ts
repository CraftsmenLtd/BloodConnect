import { GenericMessage } from '@commons/dto/MessageDTO'

export function getEmailVerificationMessage(userName: string, securityCode: string): GenericMessage {
  return {
    title: 'Welcome to Blood Connect!',
    content: `Hello ${userName},<br/><br/>
              Welcome! Please verify your email using the following code: ${securityCode}.<br/><br/>
              Thanks!`
  }
}

export function getPasswordResetVerificationMessage(userName: string, securityCode: string): GenericMessage {
  return {
    title: 'Reset your password for Blood Connect',
    content: `Hello ${userName},<br/><br/>
              You have requested to reset your password.<br/>
              Use the following code to reset your password: ${securityCode}<br/><br/>
              If you did not request this, please ignore this email.<br/><br/>
              Thanks!`
  }
}
