import { GenericMessage } from '@commons/dto/MessageDTO'
import { EMAIL_VERIFICATION_CONTENT, EMAIL_VERIFICATION_TITLE, PASSWORD_RESET_CONTENT, PASSWORD_RESET_TITLE } from '@application/utils/messageConstants'
import { replaceTemplatePlaceholders } from '@application/utils/formatString'

export function getEmailVerificationMessage(userName: string, securityCode: string): GenericMessage {
  return {
    title: EMAIL_VERIFICATION_TITLE,
    content: replaceTemplatePlaceholders(EMAIL_VERIFICATION_CONTENT, userName, securityCode)
  }
}

export function getPasswordResetVerificationMessage(userName: string, securityCode: string): GenericMessage {
  return {
    title: PASSWORD_RESET_TITLE,
    content: replaceTemplatePlaceholders(PASSWORD_RESET_CONTENT, userName, securityCode)
  }
}
