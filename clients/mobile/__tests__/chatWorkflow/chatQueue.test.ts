import fc from 'fast-check'
import { emptyOutbox, enqueue, ack, pending } from '../../src/chatWorkflow/chatQueue'
import type { ChatMessageView } from '../../src/chatWorkflow/types'

const messageArb: fc.Arbitrary<ChatMessageView> = fc.record({
  channelId: fc.constant('req-1#donor-1'),
  clientMessageId: fc.string({ minLength: 1, maxLength: 8 }),
  senderId: fc.constant('user-1'),
  body: fc.string({ minLength: 1, maxLength: 10 }),
  sentAt: fc.constant('2026-06-26T00:00:00.000Z'),
  status: fc.constant('queued' as const)
})

describe('chatQueue (outbox)', () => {
  it('enqueue is idempotent by clientMessageId (PBT)', () => {
    fc.assert(
      fc.property(messageArb, (message) => {
        const once = enqueue(emptyOutbox(), message)
        const twice = enqueue(once, message)
        expect(pending(twice)).toHaveLength(pending(once).length)
      })
    )
  })

  it('keeps pending clientMessageIds unique across many enqueues (PBT)', () => {
    fc.assert(
      fc.property(fc.array(messageArb, { maxLength: 20 }), (messages) => {
        const state = messages.reduce((accumulator, message) => enqueue(accumulator, message), emptyOutbox())
        const ids = pending(state).map((message) => message.clientMessageId)
        expect(new Set(ids).size).toBe(ids.length)
      })
    )
  })

  it('ack removes a queued message', () => {
    const message: ChatMessageView = {
      channelId: 'c',
      clientMessageId: 'cm-1',
      senderId: 'u',
      body: 'hi',
      sentAt: '2026-06-26T00:00:00.000Z',
      status: 'queued'
    }
    const state = enqueue(emptyOutbox(), message)
    expect(pending(ack(state, 'cm-1'))).toHaveLength(0)
  })
})
