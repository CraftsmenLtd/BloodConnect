import InvalidTokenError from '../../../authWorkflows/errors/InvalidTokenError'
import { GenericErrorCodes } from '@commons/libs/errors/errorCodes'

describe('InvalidTokenError', () => {
  it('should contain correct name and errorCode', () => {
    const invalidTokenError = new InvalidTokenError('invalid token error occurred')
    expect(invalidTokenError.name).toBe('InvalidTokenError')
    expect(invalidTokenError.message).toBe('invalid token error occurred')
    expect(invalidTokenError.errorCode).toBe(GenericErrorCodes.unauthorized)
  })
})
