import { ChatChannelModel } from '../../commons/ddbModels/ChatChannelModel'
import type { ChatChannelDTO } from '../../../../../commons/dto/ChatDTO'
import { CHAT_MESSAGE_RETENTION_DAYS } from '../../../../../commons/libs/constants/NoMagicNumbers'

const SECONDS_PER_DAY = 24 * 60 * 60
const CHANNEL_BUFFER_DAYS = 7

describe('ChatChannelModel', () => {
  const model = new ChatChannelModel()
  const createdAt = '2026-06-26T10:00:00.000Z'

  const baseDto: ChatChannelDTO = {
    channelId: 'seeker-1#req-1#donor-1',
    seekerId: 'seeker-1',
    donorId: 'donor-1',
    requestPostId: 'req-1',
    status: 'ACTIVE',
    createdAt,
    lastMessagePreview: 'hi there',
    unreadCount: 2
  }

  const expectedExpiresAt =
    Math.floor(new Date(createdAt).getTime() / 1000) +
    (CHAT_MESSAGE_RETENTION_DAYS + CHANNEL_BUFFER_DAYS) * SECONDS_PER_DAY

  test('builds exact METADATA key strings', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.PK).toBe('CHAT#seeker-1#req-1#donor-1')
    expect(fields.SK).toBe('METADATA')
  })

  test('expiresAt is epoch seconds = createdAt + retention + buffer', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.expiresAt).toBe(expectedExpiresAt)
    expect(Number.isInteger(fields.expiresAt)).toBe(true)
    expect(String(fields.expiresAt)).not.toContain('T')
  })

  test('fromDto/toDto round-trips losslessly', () => {
    expect(model.toDto(model.fromDto(baseDto))).toEqual(baseDto)
  })

  test('builds both participant inbox pointers with the same expiresAt buffer', () => {
    const [seekerPointer, donorPointer] = model.toInboxPointers(baseDto)

    expect(seekerPointer.PK).toBe('USER#seeker-1')
    expect(seekerPointer.SK).toBe('CHAT#seeker-1#req-1#donor-1')
    expect(donorPointer.PK).toBe('USER#donor-1')
    expect(donorPointer.SK).toBe('CHAT#seeker-1#req-1#donor-1')

    expect(seekerPointer.lastMessagePreview).toBe('hi there')
    expect(seekerPointer.unreadCount).toBe(2)
    expect(seekerPointer.expiresAt).toBe(expectedExpiresAt)
    expect(donorPointer.expiresAt).toBe(expectedExpiresAt)
  })
})
