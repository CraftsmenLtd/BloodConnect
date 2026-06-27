import ApplicationError from '../../../commons/libs/errors/ApplicationError'
import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'

// GENERIC_CODES has no FORBIDDEN entry; chat authorization/lock failures map to 403.
const FORBIDDEN_CODE = 403

export class NotParticipantError extends ApplicationError {
  constructor(message = 'User is not a participant of this chat channel') {
    super('NotParticipantError', message, FORBIDDEN_CODE)
  }
}

export class ChannelLockedError extends ApplicationError {
  constructor(message = 'This conversation is closed') {
    super('ChannelLockedError', message, FORBIDDEN_CODE)
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message = 'Message rate limit exceeded') {
    super('RateLimitError', message, GENERIC_CODES.TOO_MANY_REQUESTS)
  }
}

export class ChatMessageValidationError extends ApplicationError {
  constructor(message: string) {
    super('ChatMessageValidationError', message, GENERIC_CODES.BAD_REQUEST)
  }
}
