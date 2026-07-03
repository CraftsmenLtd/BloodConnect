import fc from 'fast-check'
import { isValidId, validateBody, validateIds } from '../../chatWorkflow/validation'
import { MAX_MESSAGE_LENGTH } from '../../chatWorkflow/Types'
import ChatOperationError from '../../chatWorkflow/ChatOperationError'
import { idArb, bodyArb } from '../utils/chatGenerators'

describe('chat validation', () => {
  describe('validateBody', () => {
    it('accepts generated bodies and returns the trimmed value within bound (PBT)', () => {
      fc.assert(
        fc.property(bodyArb, (body) => {
          const result = validateBody(body)
          expect(result).toBe(body.trim())
          expect(result.length).toBeGreaterThanOrEqual(1)
          expect(result.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH)
        })
      )
    })

    it('rejects empty / whitespace-only bodies', () => {
      expect(() => validateBody('   ')).toThrow(ChatOperationError)
      expect(() => validateBody('')).toThrow(ChatOperationError)
    })

    it('rejects bodies longer than the maximum (PBT)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_MESSAGE_LENGTH + 1, max: MAX_MESSAGE_LENGTH + 50 }),
          (length) => {
            expect(() => validateBody('a'.repeat(length))).toThrow(ChatOperationError)
          }
        )
      )
    })

    it('rejects disallowed control characters', () => {
      const withNullChar = `hello${String.fromCharCode(0)}world`
      expect(() => validateBody(withNullChar)).toThrow(ChatOperationError)
    })

    it('allows emoji and newlines', () => {
      const text = `hi 🩸${String.fromCharCode(10)}thanks`
      expect(validateBody(text)).toBe(text)
    })
  })

  describe('validateIds', () => {
    it('accepts generated identifiers (PBT)', () => {
      fc.assert(
        fc.property(idArb, (id) => {
          expect(isValidId(id)).toBe(true)
          expect(() => validateIds({ id })).not.toThrow()
        })
      )
    })

    it('rejects identifiers containing the key delimiter or invalid characters', () => {
      expect(() => validateIds({ id: 'has#hash' })).toThrow(ChatOperationError)
      expect(() => validateIds({ id: 'has space' })).toThrow(ChatOperationError)
      expect(() => validateIds({ id: '' })).toThrow(ChatOperationError)
    })
  })
})
