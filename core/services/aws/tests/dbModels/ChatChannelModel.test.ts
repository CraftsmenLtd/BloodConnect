import fc from 'fast-check'
import { ChatChannelModel } from '../../commons/ddbModels/ChatChannelModel'
import { channelArb } from '../mock/chatArbitraries'

describe('ChatChannelModel', () => {
  const model = new ChatChannelModel()

  it('exposes the primary index and no secondary indexes', () => {
    expect(model.getPrimaryIndex()).toEqual({ partitionKey: 'PK', sortKey: 'SK' })
    expect(model.getIndexDefinitions()).toEqual({})
  })

  it('round-trips DTO -> item -> DTO (PBT)', () => {
    fc.assert(
      fc.property(channelArb, (channel) => {
        expect(model.toDto(model.fromDto(channel))).toEqual(channel)
      })
    )
  })

  it('builds the META key shape', () => {
    fc.assert(
      fc.property(channelArb, (channel) => {
        const item = model.fromDto(channel)
        expect(item.PK).toBe(`CHAT_CHANNEL#${channel.channelId}`)
        expect(item.SK).toBe('META')
      })
    )
  })
})
