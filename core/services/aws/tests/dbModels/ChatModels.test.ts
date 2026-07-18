import {
  ChatChannelModel,
  buildChannelId,
  parseChannelId
} from '../../commons/ddbModels/ChatChannelModel'
import { ChatMembershipModel } from '../../commons/ddbModels/ChatMembershipModel'
import {
  ChatMessageModel,
  CHAT_MESSAGE_TTL_DAYS
} from '../../commons/ddbModels/ChatMessageModel'
import { ChatConnectionModel } from '../../commons/ddbModels/ChatConnectionModel'
import {
  ChatChannelStatus,
  ChatRole,
  type ChatChannelDTO,
  type ChatMembershipDTO,
  type ChatMessageDTO,
  type ChatConnectionDTO
} from '../../../../../commons/dto/ChatDTO'

describe('ChatChannelModel keys (per-request channel query)', () => {
  const model = new ChatChannelModel()
  const baseDto: ChatChannelDTO = {
    channelId: buildChannelId('seeker-1', 'req-1', 'donor-1'),
    seekerId: 'seeker-1',
    requestPostId: 'req-1',
    donorId: 'donor-1',
    status: ChatChannelStatus.OPEN,
    context: {
      requestedBloodGroup: 'O+',
      urgencyLevel: 'urgent',
      donationDateTime: '2026-06-30T10:00:00.000Z',
      location: 'Dhaka'
    },
    createdAt: '2026-06-26T00:00:00.000Z'
  }

  test('keys all of a request\'s channels under one PK, differing by donor SK', () => {
    const donor1 = model.fromDto(baseDto)
    const donor2 = model.fromDto({
      ...baseDto,
      channelId: buildChannelId('seeker-1', 'req-1', 'donor-2'),
      donorId: 'donor-2'
    })

    expect(donor1.PK).toBe('CHANNEL#seeker-1#req-1')
    expect(donor2.PK).toBe('CHANNEL#seeker-1#req-1')
    expect(donor1.SK).toBe('DONOR#donor-1')
    expect(donor2.SK).toBe('DONOR#donor-2')
  })

  test('round-trips identity and channelId through fromDto/toDto', () => {
    const dto = model.toDto(model.fromDto(baseDto))

    expect(dto.seekerId).toBe('seeker-1')
    expect(dto.requestPostId).toBe('req-1')
    expect(dto.donorId).toBe('donor-1')
    expect(dto.channelId).toBe('seeker-1#req-1#donor-1')
    expect(dto.context.location).toBe('Dhaka')
    expect(dto.status).toBe(ChatChannelStatus.OPEN)
  })

  test('parseChannelId is the inverse of buildChannelId', () => {
    expect(parseChannelId(buildChannelId('s', 'r', 'd'))).toEqual({
      seekerId: 's',
      requestPostId: 'r',
      donorId: 'd'
    })
  })

  test('parseChannelId tolerates a # in the trailing donorId component', () => {
    expect(parseChannelId('seeker-1#req-1#donor#weird')).toEqual({
      seekerId: 'seeker-1',
      requestPostId: 'req-1',
      donorId: 'donor#weird'
    })
  })
})

describe('ChatMembershipModel keys (per-user membership query)', () => {
  const model = new ChatMembershipModel()
  const baseDto: ChatMembershipDTO = {
    userId: 'user-1',
    channelId: 'seeker-1#req-1#donor-1',
    role: ChatRole.SEEKER,
    createdAt: '2026-06-26T00:00:00.000Z'
  }

  test('keys each membership under the participant\'s own user partition', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.PK).toBe('CHATUSER#user-1')
    expect(fields.SK).toBe('CHANNEL#seeker-1#req-1#donor-1')
  })

  test('round-trips userId, channelId and role', () => {
    const dto = model.toDto(model.fromDto({
      ...baseDto,
      role: ChatRole.DONOR,
      lastReadAt: '2026-06-26T01:00:00.000Z'
    }))

    expect(dto.userId).toBe('user-1')
    expect(dto.channelId).toBe('seeker-1#req-1#donor-1')
    expect(dto.role).toBe(ChatRole.DONOR)
    expect(dto.lastReadAt).toBe('2026-06-26T01:00:00.000Z')
  })
})

describe('ChatMessageModel ordering and TTL', () => {
  const model = new ChatMessageModel()
  const baseDto: ChatMessageDTO = {
    channelId: 'seeker-1#req-1#donor-1',
    messageId: '2026-06-26T00:00:00.000Z#01',
    senderId: 'user-1',
    content: 'hello',
    createdAt: '2026-06-26T00:00:00.000Z'
  }

  test('partitions by channel and uses the time-ordered messageId as the sort key', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.PK).toBe('CHATMSG#seeker-1#req-1#donor-1')
    expect(fields.SK).toBe('2026-06-26T00:00:00.000Z#01')
  })

  test('a later messageId sorts after an earlier one (newest-first paging relies on SK order)', () => {
    const earlier = model.fromDto(baseDto)
    const later = model.fromDto({ ...baseDto, messageId: '2026-06-26T00:00:01.000Z#01' })

    expect(later.SK > earlier.SK).toBe(true)
  })

  test('derives a TTL 90 days after createdAt when none is supplied', () => {
    const fields = model.fromDto(baseDto)
    const expected = Math.floor(new Date(baseDto.createdAt).getTime() / 1000)
      + CHAT_MESSAGE_TTL_DAYS * 24 * 60 * 60

    expect(fields.ttl).toBe(expected)
  })

  test('round-trips channelId and messageId', () => {
    const dto = model.toDto(model.fromDto(baseDto))

    expect(dto.channelId).toBe('seeker-1#req-1#donor-1')
    expect(dto.messageId).toBe('2026-06-26T00:00:00.000Z#01')
    expect(dto.content).toBe('hello')
  })
})

describe('ChatConnectionModel access patterns', () => {
  const model = new ChatConnectionModel()
  const baseDto: ChatConnectionDTO = {
    connectionId: 'conn-1',
    userId: 'user-1',
    createdAt: '2026-06-26T00:00:00.000Z'
  }

  test('keys by connectionId (deletable with only connectionId) and indexes userId on GSI1', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.PK).toBe('CONNECTION#conn-1')
    expect(fields.SK).toBe('CONNECTION#conn-1')
    expect(fields.GSI1PK).toBe('CHATUSER#user-1')
    expect(fields.GSI1SK).toBe('CONNECTION#conn-1')
  })

  test('groups a user\'s multiple connections under one GSI1 partition for fanout', () => {
    const conn1 = model.fromDto(baseDto)
    const conn2 = model.fromDto({ ...baseDto, connectionId: 'conn-2' })

    expect(conn1.GSI1PK).toBe(conn2.GSI1PK)
    expect(conn1.PK).not.toBe(conn2.PK)
  })

  test('exposes GSI1 in the index definitions', () => {
    expect(model.getIndex('GSI', 'GSI1')).toEqual({ partitionKey: 'GSI1PK', sortKey: 'GSI1SK' })
  })

  test('round-trips connectionId and userId', () => {
    const dto = model.toDto(model.fromDto(baseDto))

    expect(dto.connectionId).toBe('conn-1')
    expect(dto.userId).toBe('user-1')
  })
})
