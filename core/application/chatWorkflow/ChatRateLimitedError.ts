import ApplicationError from '../../../commons/libs/errors/ApplicationError'

// Thrown when a channel exceeds the per-minute message rate limit.
export default class ChatRateLimitedError extends ApplicationError {
  constructor(message: string, errorCode: number) {
    super('ChatRateLimitedError', message, errorCode)
  }
}
