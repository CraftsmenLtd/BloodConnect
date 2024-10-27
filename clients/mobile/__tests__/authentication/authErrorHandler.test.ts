import { handleAuthError } from '../../src/authentication/services/authErrorHandler'

describe('handleAuthError', () => {
  it('should return a default message for unknown errors', () => {
    expect(handleAuthError(new Error('Some unknown error'))).toBe('Some unknown error')
  })

  it('should return a message for NotAuthorizedException', () => {
    const error = new Error('Unauthorized');
    (error as any).name = 'NotAuthorizedException'
    expect(handleAuthError(error)).toBe('Unauthorized to sign out.')
  })

  it('should return a message for NetworkError', () => {
    const error = new Error('Network issue');
    (error as any).name = 'NetworkError'
    expect(handleAuthError(error)).toBe('Network error. Check your connection.')
  })

  it('should return a message for UsernameExistsException', () => {
    const error = new Error('User exists');
    (error as any).name = 'UsernameExistsException'
    expect(handleAuthError(error)).toBe('Account already exists.')
  })

  it('should return a message for InvalidPasswordException', () => {
    const error = new Error('Weak password');
    (error as any).name = 'InvalidPasswordException'
    expect(handleAuthError(error)).toBe('Weak password. Use a stronger one.')
  })

  it('should return a message for InvalidParameterException', () => {
    const error = new Error('Invalid input');
    (error as any).name = 'InvalidParameterException'
    expect(handleAuthError(error)).toBe('Invalid input. Check your details.')
  })

  it('should return a message for LimitExceededException', () => {
    const error = new Error('Limit exceeded');
    (error as any).name = 'LimitExceededException'
    expect(handleAuthError(error)).toBe('Too many requests. Try again later.')
  })

  it('should return a message for CodeMismatchException', () => {
    const error = new Error('Code mismatch');
    (error as any).name = 'CodeMismatchException'
    expect(handleAuthError(error)).toBe('Invalid OTP code. Please try again.')
  })

  it('should return a message for ExpiredCodeException', () => {
    const error = new Error('Code expired');
    (error as any).name = 'ExpiredCodeException'
    expect(handleAuthError(error)).toBe('OTP code has expired. Request a new one.')
  })

  it('should return a message for UserNotFoundException', () => {
    const error = new Error('User not found');
    (error as any).name = 'UserNotFoundException'
    expect(handleAuthError(error)).toBe('No account found with this email.')
  })

  it('should return a message for non-error input', () => {
    expect(handleAuthError('Some random string')).toBe('Something went wrong.')
    expect(handleAuthError(null)).toBe('Something went wrong.')
  })
})
