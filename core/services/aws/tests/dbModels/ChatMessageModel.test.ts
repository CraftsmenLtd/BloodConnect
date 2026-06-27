import { ChatMessageModel } from '../../commons/ddbModels/ChatMessageModel'
import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import { CHAT_MESSAGE_RETENTION_DAYS } from '../../../../../commons/libs/constants/NoMagicNumbers'

const SECONDS_PER_DAY = 24 * 60 * 60

describe('ChatMessageModel', () => {
  const model = new ChatMessageModel()
  const clientCreatedAt = '2026-06-26T10:00:00.000Z'

  const baseDto: ChatMessageDTO = {
    channelId: 'seeker-1#req-1#donor-1',
    messageId: 'msg-1',
    senderId: 'donor-1',
    text: 'are you available?',
    createdAt: clientCreatedAt,
    expiresAt:
      Math.floor(new Date(clientCreatedAt).getTime() / 1000) +
      CHAT_MESSAGE_RETENTION_DAYS * SECONDS_PER_DAY
  }

  test('builds exact key strings', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.PK).toBe('CHATMSG#seeker-1#req-1#donor-1')
    expect(fields.SK).toBe(`${clientCreatedAt}#msg-1`)
  })

  test('SK is deterministic per messageId for the same clientCreatedAt', () => {
    const first = model.fromDto(baseDto)
    const resend = model.fromDto({ ...baseDto, text: 'resent body' })

    expect(resend.SK).toBe(first.SK)
  })

  test('expiresAt is epoch seconds = clientCreatedAt + retention', () => {
    const fields = model.fromDto(baseDto)
    const expected =
      Math.floor(new Date(clientCreatedAt).getTime() / 1000) +
      CHAT_MESSAGE_RETENTION_DAYS * SECONDS_PER_DAY

    expect(fields.expiresAt).toBe(expected)
    expect(Number.isInteger(fields.expiresAt)).toBe(true)
    expect(String(fields.expiresAt)).not.toContain('T')
  })

  test('fromDto/toDto round-trips losslessly', () => {
    expect(model.toDto(model.fromDto(baseDto))).toEqual(baseDto)
  })
})
