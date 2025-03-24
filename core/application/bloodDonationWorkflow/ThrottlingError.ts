import ApplicationError from '../../../commons/libs/errors/ApplicationError'

export default class ThrottlingError extends ApplicationError {
  constructor (message: string, errorCode: number) {
    super('ThrottlingError', message, errorCode)
  }
}
