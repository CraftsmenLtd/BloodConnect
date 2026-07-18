import ApplicationError from '../../../commons/libs/errors/ApplicationError'

// Thrown when a user who is neither the seeker nor the donor of a channel tries to act on it.
export default class NotChannelParticipantError extends ApplicationError {
  constructor(message: string, errorCode: number) {
    super('NotChannelParticipantError', message, errorCode)
  }
}
