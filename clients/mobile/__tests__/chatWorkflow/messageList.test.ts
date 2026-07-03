import fc from 'fast-check'
import { upsertMessage, unreadCount } from '../../src/chatWorkflow/messageList'
import type { ChatMessageView } from '../../src/chatWorkflow/types'

const second = (value: number): string =>
  `2026-06-26T00:00:${String(value % 60).padStart(2, '0')}.000Z`

const messageArb: fc.Arbitrary<ChatMessageView> = fc.record({
  channelId: fc.constant('c'),
  messageId: fc.option(fc.string({ minLength: 1, maxLength: 6 }), { nil: undefined }),
  clientMessageId: fc.string({ minLength: 1, maxLength: 6 }),
  senderId: fc.constantFrom('me', 'other'),
  body: fc.string({ minLength: 1, maxLength: 8 }),
  sentAt: fc.integer({ min: 0, max: 59 }).map(second),
  status: fc.constantFrom('queued' as const, 'sending' as const, 'sent' as const, 'read' as const)
})

const sortKey = (message: ChatMessageView): string =>
  `${message.sentAt}#${message.messageId ?? message.clientMessageId}`

describe('messageList', () => {
  it('keeps messages chronologically ordered with unique clientMessageIds (PBT)', () => {
    fc.assert(
      fc.property(fc.array(messageArb, { maxLength: 25 }), (messages) => {
        const result = messages.reduce<ChatMessageView[]>(
          (accumulator, message) => upsertMessage(accumulator, message),
          []
        )
        for (let index = 1; index < result.length; index += 1) {
          expect(sortKey(result[index - 1]) <= sortKey(result[index])).toBe(true)
        }
        const ids = result.map((message) => message.clientMessageId)
        expect(new Set(ids).size).toBe(ids.length)
      })
    )
  })

  it('unread count is never negative (PBT)', () => {
    fc.assert(
      fc.property(fc.array(messageArb, { maxLength: 25 }), (messages) => {
        const result = messages.reduce<ChatMessageView[]>(
          (accumulator, message) => upsertMessage(accumulator, message),
          []
        )
        expect(unreadCount(result, 'me', undefined)).toBeGreaterThanOrEqual(0)
      })
    )
  })

  it('replaces an optimistic message when the server echo arrives (same clientMessageId)', () => {
    const optimistic: ChatMessageView = {
      channelId: 'c',
      clientMessageId: 'cm-1',
      senderId: 'me',
      body: 'hi',
      sentAt: '2026-06-26T00:00:01.000Z',
      status: 'sending'
    }
    const echoed: ChatMessageView = { ...optimistic, messageId: 'm-1', status: 'sent' }
    const result = upsertMessage(upsertMessage([], optimistic), echoed)
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('sent')
    expect(result[0].messageId).toBe('m-1')
  })
})
