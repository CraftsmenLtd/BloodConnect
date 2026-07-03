import fc from 'fast-check'
import { ChatMessageModel } from '../../commons/ddbModels/ChatMessageModel'
import { messageArb } from '../mock/chatArbitraries'

describe('ChatMessageModel', () => {
  const model = new ChatMessageModel()

  it('round-trips DTO -> item -> DTO (PBT)', () => {
    fc.assert(
      fc.property(messageArb, (message) => {
        expect(model.toDto(model.fromDto(message))).toEqual(message)
      })
    )
  })

  it('orders messages chronologically by sort key', () => {
    fc.assert(
      fc.property(messageArb, (message) => {
        const item = model.fromDto(message)
        expect(item.PK).toBe(`CHAT_MSG#${message.channelId}`)
        expect(item.SK).toBe(`MSG#${message.sentAt}#${message.messageId}`)
      })
    )
  })
})
