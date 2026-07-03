import ApplicationError from '../../../commons/libs/errors/ApplicationError'
import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'

export default class ChatOperationError extends ApplicationError {
  constructor(message: string, errorCode: number) {
    super('ChatOperationError', message, errorCode)
  }
}

export const chatNotFound = (message = 'Chat channel not found'): ChatOperationError =>
  new ChatOperationError(message, GENERIC_CODES.NOT_FOUND)

export const chatForbidden = (message = 'You are not a participant of this chat'): ChatOperationError =>
  new ChatOperationError(message, GENERIC_CODES.FORBIDDEN)

export const chatConflict = (
  message = 'This chat is closed as the donation request is complete.'
): ChatOperationError => new ChatOperationError(message, GENERIC_CODES.CONFLICT)

export const chatValidation = (message: string): ChatOperationError =>
  new ChatOperationError(message, GENERIC_CODES.BAD_REQUEST)

export const chatTooManyRequests = (
  message = 'You are sending messages too quickly. Please wait a moment.'
): ChatOperationError => new ChatOperationError(message, GENERIC_CODES.TOO_MANY_REQUESTS)
