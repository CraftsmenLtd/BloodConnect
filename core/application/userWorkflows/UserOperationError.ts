// import ApplicationError from '@commons/libs/errors/ApplicationError'
import ApplicationError from '../../../commons/libs/errors/ApplicationError'

export default class UserOperationError extends ApplicationError {
  constructor(message: string, errorCode: number) {
    super('UserOperationError', message, errorCode)
  }
}
