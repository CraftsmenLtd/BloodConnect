import InvalidTokenError from '../../../authWorkflow/errors/InvalidTokenError'
import { GENERIC_CODES } from '../.../../../../../../commons/libs/constants/GenericCodes'

describe('InvalidTokenError', () => {
  it('should contain correct name and errorCode', () => {
    const invalidTokenError = new InvalidTokenError(
      'invalid token error occurred'
    )
    expect(invalidTokenError.name).toBe('InvalidTokenError')
    expect(invalidTokenError.message).toBe('invalid token error occurred')
    expect(invalidTokenError.errorCode).toBe(GENERIC_CODES.UNAUTHORIZED)
  })
})
