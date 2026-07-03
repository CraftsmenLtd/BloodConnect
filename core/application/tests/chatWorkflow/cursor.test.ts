import fc from 'fast-check'
import { encodeCursor, decodeCursor, clampLimit } from '../../chatWorkflow/cursor'
import { HISTORY_PAGE_SIZE } from '../../chatWorkflow/Types'
import ChatOperationError from '../../chatWorkflow/ChatOperationError'

const keyArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 8 }),
  fc.oneof(fc.string(), fc.integer(), fc.boolean())
)

describe('cursor', () => {
  it('round-trips a key map through encode -> decode (PBT)', () => {
    fc.assert(
      fc.property(keyArb, (key) => {
        expect(decodeCursor(encodeCursor(key))).toEqual(key)
      })
    )
  })

  it('throws ChatOperationError on a malformed cursor', () => {
    expect(() => decodeCursor('%%%not-base64-json%%%')).toThrow(ChatOperationError)
    expect(() => decodeCursor(Buffer.from('"a string"').toString('base64'))).toThrow(ChatOperationError)
  })

  describe('clampLimit (invariant: result in [1, 20])', () => {
    it('clamps any number into range (PBT)', () => {
      fc.assert(
        fc.property(fc.integer(), (limit) => {
          const clamped = clampLimit(limit)
          expect(clamped).toBeGreaterThanOrEqual(1)
          expect(clamped).toBeLessThanOrEqual(HISTORY_PAGE_SIZE)
        })
      )
    })

    it('defaults to the page size when undefined', () => {
      expect(clampLimit(undefined)).toBe(HISTORY_PAGE_SIZE)
    })
  })
})
