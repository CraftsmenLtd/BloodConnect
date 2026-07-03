import fc from 'fast-check'
import { ChatChannelMembershipModel } from '../../commons/ddbModels/ChatChannelMembershipModel'
import { membershipArb } from '../mock/chatArbitraries'

describe('ChatChannelMembershipModel', () => {
  const model = new ChatChannelMembershipModel()

  it('declares GSI1 for the inbox access pattern', () => {
    expect(model.getIndexDefinitions()).toEqual({
      GSI: { GSI1: { partitionKey: 'GSI1PK', sortKey: 'GSI1SK' } }
    })
  })

  it('round-trips DTO -> item -> DTO (PBT)', () => {
    fc.assert(
      fc.property(membershipArb, (membership) => {
        expect(model.toDto(model.fromDto(membership))).toEqual(membership)
      })
    )
  })

  it('indexes recency on GSI1SK with the latest-known timestamp', () => {
    fc.assert(
      fc.property(membershipArb, (membership) => {
        const item = model.fromDto(membership)
        const expectedRecency = `${membership.lastMessageAt ?? membership.createdAt}#${membership.channelId}`
        expect(item.GSI1PK).toBe(`CHAT_USER#${membership.userId}`)
        expect(item.GSI1SK).toBe(expectedRecency)
      })
    )
  })
})
