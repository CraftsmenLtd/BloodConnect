import ApplicationError from '@commons/libs/errors/ApplicationError'
import { GENERIC_CODES } from '@commons/libs/constants/GenericCodes'

export default class InvalidTokenError extends ApplicationError {
  constructor(message: string) {
    super('InvalidTokenError', message, GENERIC_CODES.UNAUTHORIZED)
  }
}
