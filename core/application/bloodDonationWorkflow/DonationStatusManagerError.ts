import ApplicationError from '../../../commons/libs/errors/ApplicationError'

export default class DonationStatusManagerError extends ApplicationError {
  constructor(message: string, errorCode: number) {
    super('DonationStatusManagerError', message, errorCode)
  }
}
