import fc from 'fast-check'
import type {
  ChatChannelDTO,
  ChannelMembershipDTO,
  ChatMessageDTO,
  ChatConnectionDTO,
  ChatChannelContext
} from '../../../../../commons/dto/ChatDTO'
import { ChatChannelStatus } from '../../../../../commons/dto/ChatDTO'

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._:-'.split('')

const idArb = fc
  .array(fc.constantFrom(...ID_CHARS), { minLength: 1, maxLength: 20 })
  .map((characters) => characters.join(''))

const isoArb = fc
  .date({ min: new Date('2021-01-01T00:00:00.000Z'), max: new Date('2030-01-01T00:00:00.000Z') })
  .map((date) => date.toISOString())

const ttlArb = fc.integer({ min: 1, max: 2_000_000_000 })

const channelIdArb = fc
  .tuple(idArb, idArb)
  .map(([requestPostId, donorId]) => `${requestPostId}#${donorId}`)

const contextArb: fc.Arbitrary<ChatChannelContext> = fc.record({
  requestedBloodGroup: fc.constantFrom('A+', 'O-', 'B+', 'AB-'),
  urgencyLevel: fc.constantFrom('regular', 'urgent'),
  donationDateTime: isoArb,
  location: fc.string({ maxLength: 30 })
})

export const channelArb: fc.Arbitrary<ChatChannelDTO> = fc.record({
  channelId: channelIdArb,
  seekerId: idArb,
  requestPostId: idArb,
  donorId: idArb,
  status: fc.constantFrom(ChatChannelStatus.OPEN, ChatChannelStatus.LOCKED),
  context: contextArb,
  lastMessageAt: fc.option(isoArb, { nil: undefined }),
  lastMessagePreview: fc.option(fc.string({ maxLength: 30 }), { nil: undefined }),
  createdAt: isoArb,
  ttl: ttlArb
})

export const membershipArb: fc.Arbitrary<ChannelMembershipDTO> = fc.record({
  userId: idArb,
  channelId: channelIdArb,
  otherParticipantId: idArb,
  role: fc.constantFrom('SEEKER' as const, 'DONOR' as const),
  context: contextArb,
  lastMessageAt: fc.option(isoArb, { nil: undefined }),
  lastMessagePreview: fc.option(fc.string({ maxLength: 30 }), { nil: undefined }),
  lastReadAt: fc.option(isoArb, { nil: undefined }),
  createdAt: isoArb,
  ttl: ttlArb
})

export const messageArb: fc.Arbitrary<ChatMessageDTO> = fc.record({
  channelId: channelIdArb,
  messageId: idArb,
  clientMessageId: idArb,
  senderId: idArb,
  body: fc.string({ minLength: 1, maxLength: 50 }),
  sentAt: isoArb,
  ttl: ttlArb
})

export const connectionArb: fc.Arbitrary<ChatConnectionDTO> = fc.record({
  connectionId: idArb,
  userId: idArb,
  connectedAt: isoArb,
  ttl: ttlArb
})
