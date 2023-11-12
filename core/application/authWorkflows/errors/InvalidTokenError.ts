import ApplicationError from '@commons/libs/errors/ApplicationError'
import { GenericErrorCodes } from '@commons/libs/errors/errorCodes'

export default class InvalidTokenError extends ApplicationError {
  constructor(message: string) {
    super('InvalidTokenError', message, GenericErrorCodes.unauthorized)
  }
}
