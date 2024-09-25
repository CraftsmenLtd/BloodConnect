import { GenericMessage } from '@commons/dto/MessageDTO'
import { EMAIL_VERIFICATION_TITLE, PASSWORD_RESET_TITLE, getEmailVerificationContent, getPasswordResetContent } from '@application/utils/messageConstants'

export function getEmailVerificationMessage(userName: string, securityCode: string): GenericMessage {
  return {
    title: EMAIL_VERIFICATION_TITLE,
    content: getEmailVerificationContent(userName, securityCode)
  }
}

export function getPasswordResetVerificationMessage(userName: string, securityCode: string): GenericMessage {
  return {
    title: PASSWORD_RESET_TITLE,
    content: getPasswordResetContent(userName, securityCode)
  }
}
