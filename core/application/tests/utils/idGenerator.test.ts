import { generateUniqueID } from '../../utils/idGenerator'
import { ulid } from 'ulid'

jest.mock('ulid')

describe('idGenerator', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generateUniqueID', () => {
    test('should call ulid and return generated ID', () => {
      const mockId = '01HW5K8EXAMPLE123456789'
      ;(ulid as jest.Mock).mockReturnValue(mockId)

      const result = generateUniqueID()

      expect(ulid).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockId)
    })

    test('should generate unique IDs on multiple calls', () => {
      const mockIds = [
        '01HW5K8EXAMPLE123456789',
        '01HW5K9EXAMPLE987654321',
        '01HW5KAEXAMPLEABCDEFGHI'
      ]

      ;(ulid as jest.Mock)
        .mockReturnValueOnce(mockIds[0])
        .mockReturnValueOnce(mockIds[1])
        .mockReturnValueOnce(mockIds[2])

      const result1 = generateUniqueID()
      const result2 = generateUniqueID()
      const result3 = generateUniqueID()

      expect(ulid).toHaveBeenCalledTimes(3)
      expect(result1).toBe(mockIds[0])
      expect(result2).toBe(mockIds[1])
      expect(result3).toBe(mockIds[2])
      expect(result1).not.toBe(result2)
      expect(result2).not.toBe(result3)
    })

    test('should return string type', () => {
      const mockId = '01HW5K8EXAMPLE123456789'
      ;(ulid as jest.Mock).mockReturnValue(mockId)

      const result = generateUniqueID()

      expect(typeof result).toBe('string')
    })

    test('should generate ID with ULID format', () => {
      const mockId = '01HW5K8EXAMPLE12345678ABCD'
      ;(ulid as jest.Mock).mockReturnValue(mockId)

      const result = generateUniqueID()

      // ULID format: 26 characters, uppercase alphanumeric
      expect(result).toHaveLength(26)
      expect(result).toMatch(/^[0-9A-Z]{26}$/)
    })

    test('should handle empty string from ulid', () => {
      (ulid as jest.Mock).mockReturnValue('')

      const result = generateUniqueID()

      expect(result).toBe('')
    })

    test('should propagate any errors from ulid', () => {
      const error = new Error('ULID generation failed')
      ;(ulid as jest.Mock).mockImplementation(() => {
        throw error
      })

      expect(() => generateUniqueID()).toThrow('ULID generation failed')
    })

    test('should generate IDs in rapid succession', () => {
      const mockIds = Array.from({ length: 100 }, (_, i) =>
        `01HW5K${i.toString().padStart(20, '0')}`
      )

      mockIds.forEach((id) => {
        (ulid as jest.Mock).mockReturnValueOnce(id)
      })

      const results = Array.from({ length: 100 }, () => generateUniqueID())

      expect(ulid).toHaveBeenCalledTimes(100)
      expect(results).toHaveLength(100)
      expect(new Set(results).size).toBe(100) // All unique
    })

    test('should call ulid without any arguments', () => {
      const mockId = '01HW5K8EXAMPLE123456789'
      ;(ulid as jest.Mock).mockReturnValue(mockId)

      generateUniqueID()

      expect(ulid).toHaveBeenCalledWith()
    })

    test('should be a pure function that delegates to ulid', () => {
      const mockId1 = '01HW5K8EXAMPLE111111111'
      const mockId2 = '01HW5K8EXAMPLE222222222'

      ;(ulid as jest.Mock).mockReturnValueOnce(mockId1)
      const result1 = generateUniqueID()

      ;(ulid as jest.Mock).mockReturnValueOnce(mockId2)
      const result2 = generateUniqueID()

      expect(result1).toBe(mockId1)
      expect(result2).toBe(mockId2)
    })

    test('should handle various ULID formats', () => {
      const testIds = [
        '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        '01HW5K8ABCDEFGHIJKLMNOPQRS',
        '7ZZZZZZZZZZZZZZZZZZZZZZZZZ'
      ]

      testIds.forEach((mockId) => {
        (ulid as jest.Mock).mockReturnValueOnce(mockId)
        const result = generateUniqueID()
        expect(result).toBe(mockId)
      })

      expect(ulid).toHaveBeenCalledTimes(testIds.length)
    })
  })
})
