import { GenericMessage } from '../../../commons/dto/MessageDTO'
import { EMAIL_VERIFICATION_CONTENT, EMAIL_VERIFICATION_TITLE, PASSWORD_RESET_CONTENT, PASSWORD_RESET_TITLE, APP_USER_WELCOME_MAIL_TITLE, APP_USER_WELCOME_MAIL_CONTENT } from '../utils/messageConstants'
import { replaceTemplatePlaceholders } from '../utils/formatString'

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

export function getAppUserWellcomeMailMessage(userName: string): GenericMessage {
  return {
    title: APP_USER_WELCOME_MAIL_TITLE,
    content: replaceTemplatePlaceholders(APP_USER_WELCOME_MAIL_CONTENT, userName)
  }
}
