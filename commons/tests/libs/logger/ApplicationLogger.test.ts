import Environments from '@commons/libs/constants/Environments'
import getApplicationLogger from '@commons/libs/logger/ApplicationLogger'

describe('ApplicationLogger', () => {
  let logMock: jest.SpyInstance
  let debugMock: jest.SpyInstance
  let warnMock: jest.SpyInstance
  let errorMock: jest.SpyInstance

  beforeEach(() => {
    logMock = jest.spyOn(console, 'log').mockImplementation()
    debugMock = jest.spyOn(console, 'debug').mockImplementation()
    warnMock = jest.spyOn(console, 'warn').mockImplementation()
    errorMock = jest.spyOn(console, 'error').mockImplementation()
  })

  it('should not log for production environments', () => {
    const logger = getApplicationLogger(Environments.PRODUCTION)
    logger.info('test log')
    logger.debug('test log')
    logger.warn('test log')
    logger.error('test log')

    expect(logMock).not.toHaveBeenCalled()
    expect(debugMock).not.toHaveBeenCalled()
    expect(warnMock).not.toHaveBeenCalled()
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('should log for dev environments', () => {
    const logger = getApplicationLogger(Environments.DEV)
    logger.info('test log')
    logger.debug('test log')
    logger.warn('test log')
    logger.error('test log')

    expect(logMock).toHaveBeenCalled()
    expect(debugMock).toHaveBeenCalled()
    expect(warnMock).toHaveBeenCalled()
    expect(errorMock).toHaveBeenCalled()
  })

  it('should log for qa environments', () => {
    const logger = getApplicationLogger(Environments.QA)
    logger.info('test log')
    logger.debug('test log')
    logger.warn('test log')
    logger.error('test log')

    expect(logMock).toHaveBeenCalled()
    expect(debugMock).toHaveBeenCalled()
    expect(warnMock).toHaveBeenCalled()
    expect(errorMock).toHaveBeenCalled()
  })

  it('should log for local environments', () => {
    const logger = getApplicationLogger(Environments.LOCAL)
    logger.info('test log')
    logger.debug('test log')
    logger.warn('test log')
    logger.error('test log')

    expect(logMock).toHaveBeenCalled()
    expect(debugMock).toHaveBeenCalled()
    expect(warnMock).toHaveBeenCalled()
    expect(errorMock).toHaveBeenCalled()
  })

  afterEach(() => {
    logMock.mockRestore()
    debugMock.mockRestore()
    warnMock.mockRestore()
    errorMock.mockRestore()
  })
})
