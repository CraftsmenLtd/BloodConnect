import ChatChannelModel from '../../commons/ddbModels/ChatChannelModel'
import ChatMessageModel from '../../commons/ddbModels/ChatMessageModel'
import ChatConnectionModel, {
  CONNECTION_USER_GSI
} from '../../commons/ddbModels/ChatConnectionModel'
import UserChannelModel from '../../commons/ddbModels/UserChannelModel'
import { MessageDeliveryMethod } from '../../../../../commons/dto/ChatDTO'

describe('chat model adapters', () => {
  it('round-trips a chat channel', () => {
    const model = new ChatChannelModel()
    const dto = {
      channelId: 'channel-1',
      seekerId: 'seeker-1',
      requestPostId: 'request-1',
      donorId: 'donor-1',
      locked: false,
      createdAt: '2024-01-01T00:00:00Z'
    }
    const fields = model.fromDto(dto)

    expect(fields.PK).toBe('CHANNEL#channel-1')
    expect(fields.SK).toBe('META')
    expect(model.toDto(fields)).toEqual(dto)
    expect(model.getPrimaryIndex()).toEqual({ partitionKey: 'PK', sortKey: 'SK' })
  })

  it('round-trips a chat message and encodes the timestamp in the sort key', () => {
    const model = new ChatMessageModel()
    const dto = {
      channelId: 'channel-1',
      messageId: 'msg-1',
      senderId: 'seeker-1',
      content: 'hello',
      deliveredVia: MessageDeliveryMethod.WEBSOCKET,
      createdAt: '2024-01-01T00:00:00Z',
      expiresAt: 1234567890
    }
    const fields = model.fromDto(dto)

    expect(fields.PK).toBe('CHANNEL#channel-1')
    expect(fields.SK).toBe('MSG#2024-01-01T00:00:00Z#msg-1')
    expect(model.toDto(fields)).toEqual(dto)
  })

  it('round-trips a connection and exposes the user GSI', () => {
    const model = new ChatConnectionModel()
    const dto = {
      connectionId: 'conn-1',
      userId: 'user-1',
      connectedAt: '2024-01-01T00:00:00Z',
      expiresAt: 1234567890
    }
    const fields = model.fromDto(dto)

    expect(fields.PK).toBe('CONN#conn-1')
    expect(fields.GSI1PK).toBe('USER#user-1')
    expect(fields.GSI1SK).toBe('CONN#conn-1')
    expect(model.toDto(fields)).toEqual(dto)
    expect(model.getIndex('GSI', CONNECTION_USER_GSI)).toEqual({
      partitionKey: 'GSI1PK',
      sortKey: 'GSI1SK'
    })
  })

  it('round-trips a user channel row', () => {
    const model = new UserChannelModel()
    const dto = {
      userId: 'user-1',
      channelId: 'channel-1',
      unreadCount: 3,
      updatedAt: '2024-01-01T00:00:00Z'
    }
    const fields = model.fromDto(dto)

    expect(fields.PK).toBe('USER#user-1')
    expect(fields.SK).toBe('CHANNEL#channel-1')
    expect(model.toDto(fields)).toEqual(dto)
    expect(model.getIndexDefinitions()).toEqual({})
  })
})
