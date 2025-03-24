import ApplicationError from '../../../commons/libs/errors/ApplicationError'

export default class BloodDonationOperationError extends ApplicationError {
  constructor (message: string, errorCode: number) {
    super('BloodDonationOperationError', message, errorCode)
  }
}
