import fc from 'fast-check'
import { parseInboundFrame, validateInboundFrame } from '../../chatWorkflow/wsFrame'
import type { InboundFrame } from '../../chatWorkflow/wsFrame'
import ChatOperationError from '../../chatWorkflow/ChatOperationError'
import { idArb, bodyArb } from '../utils/chatGenerators'

const channelIdArb = fc.tuple(idArb, idArb).map(([requestPostId, donorId]) => `${requestPostId}#${donorId}`)
const trimmedBodyArb = bodyArb.map((body) => body.trim()).filter((body) => body.length > 0)

const frameArb: fc.Arbitrary<InboundFrame> = fc.oneof(
  fc.record({
    action: fc.constant('sendMessage' as const),
    channelId: channelIdArb,
    body: trimmedBodyArb,
    clientMessageId: idArb
  }),
  fc.record({ action: fc.constant('typing' as const), channelId: channelIdArb }),
  fc.record({ action: fc.constant('markRead' as const), channelId: channelIdArb })
)

describe('wsFrame', () => {
  it('round-trips a valid frame through JSON.stringify -> parseInboundFrame (PBT)', () => {
    fc.assert(
      fc.property(frameArb, (frame) => {
        expect(parseInboundFrame(JSON.stringify(frame))).toEqual(frame)
      })
    )
  })

  it('rejects an unknown action', () => {
    expect(() => validateInboundFrame({ action: 'delete', channelId: 'r#d' })).toThrow(ChatOperationError)
  })

  it('rejects a non-composite channelId', () => {
    expect(() => validateInboundFrame({ action: 'typing', channelId: 'no-hash' })).toThrow(ChatOperationError)
  })

  it('rejects an over-long body on sendMessage', () => {
    expect(() =>
      validateInboundFrame({ action: 'sendMessage', channelId: 'r#d', body: 'a'.repeat(2001), clientMessageId: 'c1' })
    ).toThrow(ChatOperationError)
  })

  it('rejects malformed and empty raw frames', () => {
    expect(() => parseInboundFrame('not json')).toThrow(ChatOperationError)
    expect(() => parseInboundFrame('')).toThrow(ChatOperationError)
    expect(() => parseInboundFrame(null)).toThrow(ChatOperationError)
  })
})
