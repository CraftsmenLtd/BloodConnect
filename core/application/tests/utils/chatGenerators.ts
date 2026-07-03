import fc from 'fast-check'
import type {
  ChatChannelDTO,
  ChannelMembershipDTO,
  ChatMessageDTO,
  ChatConnectionDTO,
  ChatChannelContext
} from '../../../../commons/dto/ChatDTO'
import { ChatChannelStatus } from '../../../../commons/dto/ChatDTO'
import { buildChannelId } from '../../chatWorkflow/Types'

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._:-'.split('')
const BODY_CHARS = [...'abcdefghijklmnopqrstuvwxyz ABC0123', '😀', '🩸', '👍', 'é', 'ñ']

// Identifiers match validation.ts ID_PATTERN and never contain '#'
export const idArb = fc
  .array(fc.constantFrom(...ID_CHARS), { minLength: 1, maxLength: 20 })
  .map((characters) => characters.join(''))

export const bodyArb = fc
  .array(fc.constantFrom(...BODY_CHARS), { minLength: 1, maxLength: 40 })
  .map((characters) => characters.join(''))
  .filter((value) => value.trim().length > 0)

export const isoArb = fc
  .date({ min: new Date('2021-01-01T00:00:00.000Z'), max: new Date('2030-01-01T00:00:00.000Z') })
  .map((date) => date.toISOString())

export const ttlArb = fc.integer({ min: 1, max: 2_000_000_000 })

export const contextArb: fc.Arbitrary<ChatChannelContext> = fc.record({
  requestedBloodGroup: fc.constantFrom('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  urgencyLevel: fc.constantFrom('regular', 'urgent'),
  donationDateTime: isoArb,
  location: fc.string({ maxLength: 40 })
})

export const channelArb: fc.Arbitrary<ChatChannelDTO> = fc
  .record({
    seekerId: idArb,
    requestPostId: idArb,
    donorId: idArb,
    status: fc.constantFrom(ChatChannelStatus.OPEN, ChatChannelStatus.LOCKED),
    context: contextArb,
    lastMessageAt: fc.option(isoArb, { nil: undefined }),
    lastMessagePreview: fc.option(fc.string({ maxLength: 40 }), { nil: undefined }),
    createdAt: isoArb,
    ttl: ttlArb
  })
  .map((channel) => ({
    ...channel,
    channelId: buildChannelId(channel.requestPostId, channel.donorId)
  }))

export const membershipArb: fc.Arbitrary<ChannelMembershipDTO> = fc.record({
  userId: idArb,
  channelId: fc.tuple(idArb, idArb).map(([requestPostId, donorId]) =>
    buildChannelId(requestPostId, donorId)
  ),
  otherParticipantId: idArb,
  role: fc.constantFrom('SEEKER' as const, 'DONOR' as const),
  context: contextArb,
  lastMessageAt: fc.option(isoArb, { nil: undefined }),
  lastMessagePreview: fc.option(fc.string({ maxLength: 40 }), { nil: undefined }),
  lastReadAt: fc.option(isoArb, { nil: undefined }),
  createdAt: isoArb,
  ttl: ttlArb
})

export const messageArb: fc.Arbitrary<ChatMessageDTO> = fc.record({
  channelId: fc.tuple(idArb, idArb).map(([requestPostId, donorId]) =>
    buildChannelId(requestPostId, donorId)
  ),
  messageId: idArb,
  clientMessageId: idArb,
  senderId: idArb,
  body: bodyArb,
  sentAt: isoArb,
  ttl: ttlArb
})

export const connectionArb: fc.Arbitrary<ChatConnectionDTO> = fc.record({
  connectionId: idArb,
  userId: idArb,
  connectedAt: isoArb,
  ttl: ttlArb
})
