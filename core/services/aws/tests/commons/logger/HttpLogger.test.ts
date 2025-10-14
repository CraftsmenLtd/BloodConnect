import { createHTTPLogger } from '../../../commons/logger/HttpLogger'
import { JsonLogger } from '../../../../../../commons/libs/logger/JsonLogger'

jest.mock('../../../../../../commons/libs/logger/JsonLogger', () => ({
  JsonLogger: {
    child: jest.fn()
  }
}))

describe('HttpLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createHTTPLogger', () => {
    it('should create logger with all required attributes', () => {
      const userId = 'test-user-id'
      const apiGwRequestId = 'test-api-gw-request-id'
      const cloudFrontRequestId = 'test-cloudfront-request-id'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      const logger = createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        apiGwRequestId,
        cloudFrontRequestId
      })
      expect(logger).toBe(mockLogger)
    })

    it('should create logger with extra arguments', () => {
      const userId = 'test-user-id'
      const apiGwRequestId = 'test-api-gw-request-id'
      const cloudFrontRequestId = 'test-cloudfront-request-id'
      const extraArgs = {
        requestPostId: 'test-request-post-id',
        seekerId: 'test-seeker-id',
        customField: 'custom-value'
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      const logger = createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        apiGwRequestId,
        cloudFrontRequestId,
        ...extraArgs
      })
      expect(logger).toBe(mockLogger)
    })

    it('should create logger without extra arguments', () => {
      const userId = 'test-user-id'
      const apiGwRequestId = 'test-api-gw-request-id'
      const cloudFrontRequestId = 'test-cloudfront-request-id'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      const logger = createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        apiGwRequestId,
        cloudFrontRequestId
      })
      expect(logger).toBe(mockLogger)
    })

    it('should handle complex userId', () => {
      const userId = 'complex-user-id-with-special-chars-!@#$%'
      const apiGwRequestId = 'api-gw-request-id'
      const cloudFrontRequestId = 'cloudfront-request-id'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        apiGwRequestId,
        cloudFrontRequestId
      })
    })

    it('should handle long request IDs', () => {
      const userId = 'test-user-id'
      const apiGwRequestId =
        'very-long-api-gateway-request-id-with-many-characters-and-dashes-12345'
      const cloudFrontRequestId =
        'very-long-cloudfront-request-id-with-many-characters-and-dashes-67890'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        apiGwRequestId,
        cloudFrontRequestId
      })
    })

    it('should handle extra args with nested objects', () => {
      const userId = 'test-user-id'
      const apiGwRequestId = 'test-api-gw-request-id'
      const cloudFrontRequestId = 'test-cloudfront-request-id'
      const extraArgs = {
        metadata: {
          requestPostId: 'test-request-post-id',
          location: {
            lat: 23.8103,
            lng: 90.4125
          }
        },
        timestamps: {
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        apiGwRequestId,
        cloudFrontRequestId,
        ...extraArgs
      })
    })

    it('should handle empty string values', () => {
      const userId = ''
      const apiGwRequestId = ''
      const cloudFrontRequestId = ''

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId: '',
        apiGwRequestId: '',
        cloudFrontRequestId: ''
      })
    })

    it('should handle multiple extra arguments', () => {
      const userId = 'test-user-id'
      const apiGwRequestId = 'test-api-gw-request-id'
      const cloudFrontRequestId = 'test-cloudfront-request-id'
      const extraArgs = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
        field4: 123,
        field5: true,
        field6: null,
        field7: undefined
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        apiGwRequestId,
        cloudFrontRequestId,
        ...extraArgs
      })
    })

    it('should return logger instance with correct type', () => {
      const userId = 'test-user-id'
      const apiGwRequestId = 'test-api-gw-request-id'
      const cloudFrontRequestId = 'test-cloudfront-request-id'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      const logger = createHTTPLogger(userId, apiGwRequestId, cloudFrontRequestId)

      expect(logger).toHaveProperty('info')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('debug')
    })

    it('should create separate logger instances for different calls', () => {
      const mockLogger1 = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      const mockLogger2 = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock)
        .mockReturnValueOnce(mockLogger1)
        .mockReturnValueOnce(mockLogger2)

      const logger1 = createHTTPLogger('user-1', 'req-1', 'cf-1')
      const logger2 = createHTTPLogger('user-2', 'req-2', 'cf-2')

      expect(JsonLogger.child).toHaveBeenCalledTimes(2)
      expect(logger1).toBe(mockLogger1)
      expect(logger2).toBe(mockLogger2)
    })
  })
})
