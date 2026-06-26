import ApplicationError from '../../../commons/libs/errors/ApplicationError'

export default class ChatOperationError extends ApplicationError {
  constructor(message: string, errorCode: number) {
    super('ChatOperationError', message, errorCode)
  }
}
