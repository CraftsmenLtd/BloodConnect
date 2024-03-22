import ApplicationError from '../../../libs/errors/ApplicationError'

describe('ApplicationError', () => {
  it('should contain name, message and errorCode', () => {
    const appError = new ApplicationError('test name', 'test message', 100)
    expect(appError.name).toBe('test name')
    expect(appError.message).toBe('test message')
    expect(appError.errorCode).toBe(100)
  })
})
