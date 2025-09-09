import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'

export default class SchedulerOperationError extends Error {
  public code: string

  constructor(message: string, code: string = GENERIC_CODES.INTERNAL_SERVER_ERROR) {
    super(message)
    this.name = 'SchedulerOperationError'
    this.code = code
  }
}