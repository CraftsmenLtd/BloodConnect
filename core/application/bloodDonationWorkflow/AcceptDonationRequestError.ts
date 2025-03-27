import ApplicationError from '../../../commons/libs/errors/ApplicationError'

export default class AcceptDonationRequestError extends ApplicationError {
  constructor (message: string, errorCode: number) {
    super('AcceptDonationRequestError', message, errorCode)
  }
}
