import InvalidTokenError from '../../../authWorkflows/errors/InvalidTokenError'
import { GenericCodes } from '@commons/libs/constants/GenericCodes'

describe('InvalidTokenError', () => {
  it('should contain correct name and errorCode', () => {
    const invalidTokenError = new InvalidTokenError('invalid token error occurred')
    expect(invalidTokenError.name).toBe('InvalidTokenError')
    expect(invalidTokenError.message).toBe('invalid token error occurred')
    expect(invalidTokenError.errorCode).toBe(GenericCodes.unauthorized)
  })
})
