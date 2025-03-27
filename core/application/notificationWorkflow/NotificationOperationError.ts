import ApplicationError from '../../../commons/libs/errors/ApplicationError'

export default class NotificationOperationError extends ApplicationError {
  constructor (message: string, errorCode: number) {
    super('NotificationOperationError', message, errorCode)
  }
}
