import ApplicationError from '../../../commons/libs/errors/ApplicationError'

// Thrown when a message is sent to a channel that is not OPEN (locked or never opened).
export default class ChannelLockedError extends ApplicationError {
  constructor(message: string, errorCode: number) {
    super('ChannelLockedError', message, errorCode)
  }
}
