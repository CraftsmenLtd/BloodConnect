import ApplicationError from '../../../commons/libs/errors/ApplicationError'

export default class DonationRecordOperationError extends ApplicationError {
  constructor (message: string, errorCode: number) {
    super('DonationRecordOperationError', message, errorCode)
  }
}
