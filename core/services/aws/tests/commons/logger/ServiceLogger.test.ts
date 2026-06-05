import { createServiceLogger } from '../../../commons/logger/ServiceLogger'
import { JsonLogger } from '../../../../../../commons/libs/logger/JsonLogger'

jest.mock('../../../../../../commons/libs/logger/JsonLogger', () => ({
  JsonLogger: {
    child: jest.fn()
  }
}))

describe('ServiceLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createServiceLogger', () => {
    it('should create logger with userId only', () => {
      const userId = 'test-user-id'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      const logger = createServiceLogger(userId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId
      })
      expect(logger).toBe(mockLogger)
    })

    it('should create logger with userId and extra arguments', () => {
      const userId = 'test-user-id'
      const extraArgs = {
        requestPostId: 'test-request-post-id',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      const logger = createServiceLogger(userId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        ...extraArgs
      })
      expect(logger).toBe(mockLogger)
    })

    it('should create logger without extra arguments', () => {
      const userId = 'test-user-id'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      const logger = createServiceLogger(userId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId
      })
      expect(logger).toBe(mockLogger)
    })

    it('should handle complex userId', () => {
      const userId = 'complex-user-id-with-special-chars-!@#$%'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId
      })
    })

    it('should handle extra args with nested objects', () => {
      const userId = 'test-user-id'
      const extraArgs = {
        requestPostId: 'test-request-post-id',
        metadata: {
          bloodType: 'A+',
          location: {
            lat: 23.8103,
            lng: 90.4125
          }
        },
        timestamps: {
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z'
        }
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        ...extraArgs
      })
    })

    it('should handle empty string userId', () => {
      const userId = ''

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId: ''
      })
    })

    it('should handle multiple extra arguments with various types', () => {
      const userId = 'test-user-id'
      const extraArgs = {
        stringField: 'value',
        numberField: 123,
        booleanField: true,
        nullField: null,
        undefinedField: undefined,
        arrayField: ['item1', 'item2'],
        objectField: { key: 'value' }
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        ...extraArgs
      })
    })

    it('should return logger instance with correct type', () => {
      const userId = 'test-user-id'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      const logger = createServiceLogger(userId)

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

      const logger1 = createServiceLogger('user-1')
      const logger2 = createServiceLogger('user-2')

      expect(JsonLogger.child).toHaveBeenCalledTimes(2)
      expect(logger1).toBe(mockLogger1)
      expect(logger2).toBe(mockLogger2)
    })

    it('should handle empty extra args object', () => {
      const userId = 'test-user-id'
      const extraArgs = {}

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId
      })
    })

    it('should handle requestPostId and createdAt in extra args', () => {
      const userId = 'test-user-id'
      const extraArgs = {
        requestPostId: 'request-123',
        createdAt: '2024-01-15T10:30:00.000Z'
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        requestPostId: 'request-123',
        createdAt: '2024-01-15T10:30:00.000Z'
      })
    })

    it('should handle extra args with dynamic keys', () => {
      const userId = 'test-user-id'
      const dynamicKey = 'dynamicField'
      const extraArgs = {
        [dynamicKey]: 'dynamic-value',
        staticField: 'static-value'
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId, extraArgs)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId,
        dynamicField: 'dynamic-value',
        staticField: 'static-value'
      })
    })

    it('should handle long userId strings', () => {
      const userId = 'very-long-user-id-with-many-characters-and-dashes-12345-67890-abcdef'

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId)

      expect(JsonLogger.child).toHaveBeenCalledWith({
        userId
      })
    })

    it('should preserve order of extra args when merged', () => {
      const userId = 'test-user-id'
      const extraArgs = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      }

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }

      ;(JsonLogger.child as jest.Mock).mockReturnValue(mockLogger)

      createServiceLogger(userId, extraArgs)

      const callArgs = (JsonLogger.child as jest.Mock).mock.calls[0][0]
      expect(Object.keys(callArgs)).toEqual(['userId', 'field1', 'field2', 'field3'])
    })
  })
})
