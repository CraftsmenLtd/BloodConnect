import ApplicationError from '../../../../commons/libs/errors/ApplicationError'
import { GenericCodes } from '../../../../commons/libs/constants/GenericCodes'

export default class InvalidTokenError extends ApplicationError {
  constructor(message: string) {
    super('InvalidTokenError', message, GenericCodes.unauthorized)
  }
}
