import fc from 'fast-check'
import { ChatChannelService } from '../../chatWorkflow/ChatChannelService'
import type ChatChannelRepository from '../../models/policies/repositories/ChatChannelRepository'
import type { ChatChannelDTO } from '../../../../commons/dto/ChatDTO'
import { ChatChannelStatus } from '../../../../commons/dto/ChatDTO'
import { buildChannelId } from '../../chatWorkflow/Types'
import ChatOperationError from '../../chatWorkflow/ChatOperationError'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { mockLogger } from '../mocks/mockLogger'

const buildRepository = (): jest.Mocked<ChatChannelRepository> => ({
  getChannel: jest.fn(),
  createChannelIfAbsent: jest.fn(),
  updateStatus: jest.fn(),
  updateLastMessageForMembers: jest.fn(),
  queryChannelsByUser: jest.fn(),
  getMembership: jest.fn(),
  updateLastReadAt: jest.fn()
})

const sampleContext = {
  requestedBloodGroup: 'O+',
  urgencyLevel: 'urgent',
  donationDateTime: '2026-07-01T10:00:00.000Z',
  location: 'Dhaka'
}

const openChannel = (overrides: Partial<ChatChannelDTO> = {}): ChatChannelDTO => ({
  channelId: buildChannelId('req-1', 'donor-1'),
  seekerId: 'seeker-1',
  requestPostId: 'req-1',
  donorId: 'donor-1',
  status: ChatChannelStatus.OPEN,
  context: sampleContext,
  createdAt: '2026-06-26T00:00:00.000Z',
  ttl: 1893456000,
  ...overrides
})

describe('ChatChannelService', () => {
  let repository: jest.Mocked<ChatChannelRepository>
  let service: ChatChannelService

  beforeEach(() => {
    repository = buildRepository()
    service = new ChatChannelService(repository, mockLogger)
  })

  describe('createChannelIfAbsent', () => {
    it('creates the channel with two membership rows (seeker + donor)', async () => {
      const channel = openChannel()
      repository.createChannelIfAbsent.mockResolvedValue({ created: true, channel })

      const result = await service.createChannelIfAbsent({
        seekerId: 'seeker-1',
        requestPostId: 'req-1',
        donorId: 'donor-1',
        context: sampleContext
      })

      expect(result.channelId).toBe(buildChannelId('req-1', 'donor-1'))
      const [, memberships] = repository.createChannelIfAbsent.mock.calls[0]
      expect(memberships).toHaveLength(2)
      expect(memberships.map((membership) => membership.role).sort()).toEqual(['DONOR', 'SEEKER'])
    })

    it('is idempotent — returns the existing channel when already present', async () => {
      const channel = openChannel()
      repository.createChannelIfAbsent.mockResolvedValue({ created: false, channel })

      const result = await service.createChannelIfAbsent({
        seekerId: 'seeker-1',
        requestPostId: 'req-1',
        donorId: 'donor-1',
        context: sampleContext
      })

      expect(result).toEqual(channel)
    })

    it('rejects invalid identifiers', async () => {
      await expect(
        service.createChannelIfAbsent({
          seekerId: 'bad#id',
          requestPostId: 'req-1',
          donorId: 'donor-1',
          context: sampleContext
        })
      ).rejects.toBeInstanceOf(ChatOperationError)
    })
  })

  describe('lockChannel', () => {
    it('locks an OPEN channel', async () => {
      repository.getChannel.mockResolvedValue(openChannel())
      await service.lockChannel(buildChannelId('req-1', 'donor-1'))
      expect(repository.updateStatus).toHaveBeenCalledWith(
        buildChannelId('req-1', 'donor-1'),
        ChatChannelStatus.LOCKED
      )
    })

    it('does not re-lock an already LOCKED channel', async () => {
      repository.getChannel.mockResolvedValue(openChannel({ status: ChatChannelStatus.LOCKED }))
      await service.lockChannel(buildChannelId('req-1', 'donor-1'))
      expect(repository.updateStatus).not.toHaveBeenCalled()
    })

    it('is a no-op when the channel does not exist', async () => {
      repository.getChannel.mockResolvedValue(null)
      await service.lockChannel('missing#channel')
      expect(repository.updateStatus).not.toHaveBeenCalled()
    })
  })

  describe('assertParticipant', () => {
    it('throws 403 for a non-participant', () => {
      try {
        service.assertParticipant(openChannel(), 'intruder')
        throw new Error('expected to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(ChatOperationError)
        expect((error as ChatOperationError).errorCode).toBe(GENERIC_CODES.FORBIDDEN)
      }
    })

    it('allows the seeker and the donor', () => {
      expect(() => service.assertParticipant(openChannel(), 'seeker-1')).not.toThrow()
      expect(() => service.assertParticipant(openChannel(), 'donor-1')).not.toThrow()
    })
  })

  describe('state machine (PBT)', () => {
    it('only the OPEN state triggers a transition; LOCKED never re-locks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(ChatChannelStatus.OPEN, ChatChannelStatus.LOCKED),
          async (status) => {
            repository.updateStatus.mockClear()
            repository.getChannel.mockResolvedValue(openChannel({ status }))
            await service.lockChannel(buildChannelId('req-1', 'donor-1'))
            const expectedCalls = status === ChatChannelStatus.OPEN ? 1 : 0
            expect(repository.updateStatus).toHaveBeenCalledTimes(expectedCalls)
          }
        )
      )
    })
  })
})
