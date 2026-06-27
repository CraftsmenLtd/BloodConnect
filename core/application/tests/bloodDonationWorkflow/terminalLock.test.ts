import { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import { AcceptDonationService } from '../../bloodDonationWorkflow/AcceptDonationRequestService'
import { ChatChannelService } from '../../chatWorkflow/ChatChannelService'
import type { ChatChannelOps } from '../../chatWorkflow/ChatChannelService'
import { AcceptDonationStatus, DonationStatus } from '../../../../commons/dto/DonationDTO'
import type { AcceptDonationDTO, DonationDTO } from '../../../../commons/dto/DonationDTO'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import type BloodDonationRepository from '../../models/policies/repositories/BloodDonationRepository'
import type AcceptDonationRepository from '../../models/policies/repositories/AcceptDonationRepository'
import type { DonationRecordService } from '../../bloodDonationWorkflow/DonationRecordService'
import type { UserService } from '../../userWorkflow/UserService'
import type { NotificationService } from '../../notificationWorkflow/NotificationService'
import type { LocationService } from '../../userWorkflow/LocationService'
import type { QueueModel } from '../../models/queue/QueueModel'
import { mockLogger } from '../mocks/mockLogger'
import { donationDtoMock } from '../mocks/mockDonationRequestData'
import { mockUserDetailsWithStringId } from '../mocks/mockUserData'

const seekerId = 'seeker1'
const requestPostId = 'req1'
const createdAt = '2026-06-26T10:00:00.000Z'
const notificationQueueUrl = 'http://localhost/queue'
const donorA = 'donorA'
const donorB = 'donorB'

const channelId = (donorId: string): string => `${seekerId}#${requestPostId}#${donorId}`
const pointer = (donorId: string): { SK: string } => ({ SK: `CHAT#${channelId(donorId)}` })

const buildChatOps = (): jest.Mocked<ChatChannelOps> => ({
  createChannel: jest.fn(),
  getChannel: jest.fn(),
  listChannelsForUser: jest.fn(),
  listChannelsForRequest: jest.fn().mockResolvedValue([]),
  lockChannel: jest.fn().mockResolvedValue(undefined),
  incrementUnread: jest.fn(),
  resetUnread: jest.fn()
})

const donationPost: DonationDTO = {
  ...donationDtoMock,
  seekerId,
  requestPostId,
  requestedBloodGroup: 'O-',
  status: DonationStatus.PENDING
}

describe('Lock-on-terminal hooks (TASK-011)', () => {
  describe('complete', () => {
    const bloodRepo = {
      getDonationRequest: jest.fn(),
      update: jest.fn()
    } as unknown as jest.Mocked<BloodDonationRepository>

    const donationRecordService = {
      createDonationRecord: jest.fn()
    } as unknown as jest.Mocked<DonationRecordService>

    const userService = {
      updateUserAttributes: jest.fn()
    } as unknown as jest.Mocked<UserService>

    const notificationService = {
      updateBloodDonationNotificationStatus: jest.fn(),
      sendNotification: jest.fn()
    } as unknown as jest.Mocked<NotificationService>

    const locationService = {} as unknown as LocationService
    const queueModel = {} as unknown as QueueModel

    beforeEach(() => {
      jest.resetAllMocks()
      bloodRepo.getDonationRequest.mockResolvedValue(donationPost)
    })

    const runComplete = (donorIds: string[]): Promise<void> =>
      new BloodDonationService(bloodRepo, mockLogger).completeDonationRequest(
        seekerId,
        requestPostId,
        createdAt,
        donorIds,
        donationRecordService,
        userService,
        notificationService,
        locationService,
        4,
        queueModel,
        notificationQueueUrl,
        new ChatChannelService(buildChatOps())
      )

    it('locks every channel of the request, including multiple accepted donors', async() => {
      const chatOps = buildChatOps()
      chatOps.listChannelsForRequest.mockResolvedValue([pointer(donorA), pointer(donorB)])
      const chatChannelService = new ChatChannelService(chatOps)

      await new BloodDonationService(bloodRepo, mockLogger).completeDonationRequest(
        seekerId,
        requestPostId,
        createdAt,
        [donorA, donorB],
        donationRecordService,
        userService,
        notificationService,
        locationService,
        4,
        queueModel,
        notificationQueueUrl,
        chatChannelService
      )

      expect(chatOps.listChannelsForRequest).toHaveBeenCalledWith(seekerId, requestPostId)
      expect(chatOps.lockChannel).toHaveBeenCalledTimes(2)
      expect(chatOps.lockChannel).toHaveBeenCalledWith(channelId(donorA))
      expect(chatOps.lockChannel).toHaveBeenCalledWith(channelId(donorB))
    })

    it('still marks the request COMPLETED (no regression to the terminal transition)', async() => {
      await runComplete([donorA])

      expect(bloodRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: DonationStatus.COMPLETED })
      )
    })
  })

  describe('cancel', () => {
    const bloodRepo = {
      getDonationRequest: jest.fn(),
      update: jest.fn()
    } as unknown as jest.Mocked<BloodDonationRepository>

    beforeEach(() => {
      jest.resetAllMocks()
      bloodRepo.getDonationRequest.mockResolvedValue(donationPost)
    })

    it('marks the request CANCELLED and locks all its channels', async() => {
      const chatOps = buildChatOps()
      chatOps.listChannelsForRequest.mockResolvedValue([pointer(donorA), pointer(donorB)])
      const service = new BloodDonationService(bloodRepo, mockLogger)

      await service.cancelDonationRequest(
        seekerId,
        requestPostId,
        createdAt,
        new ChatChannelService(chatOps)
      )

      expect(bloodRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: DonationStatus.CANCELLED })
      )
      expect(chatOps.lockChannel).toHaveBeenCalledTimes(2)
      expect(chatOps.lockChannel).toHaveBeenCalledWith(channelId(donorA))
      expect(chatOps.lockChannel).toHaveBeenCalledWith(channelId(donorB))
    })

    it('does not wire an EXPIRED terminal lock (ADV-004 — documented follow-up)', () => {
      const service = new BloodDonationService(bloodRepo, mockLogger)
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))

      expect(methods.some((name) => /expire/i.test(name))).toBe(false)
    })
  })

  describe('ignore', () => {
    const ignoredDonor = donorA
    const donorProfile: UserDetailsDTO = {
      ...mockUserDetailsWithStringId,
      id: ignoredDonor,
      bloodGroup: 'O-'
    }
    const seekerProfile: UserDetailsDTO = { ...mockUserDetailsWithStringId, id: seekerId }
    const acceptedRecord: AcceptDonationDTO = {
      donorId: ignoredDonor,
      seekerId,
      requestPostId,
      createdAt,
      status: AcceptDonationStatus.ACCEPTED,
      acceptanceTime: createdAt
    }

    const acceptRepo = {
      getAcceptedRequest: jest.fn(),
      deleteAcceptedRequest: jest.fn(),
      queryAcceptedRequests: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    } as unknown as jest.Mocked<AcceptDonationRepository>

    const bloodDonationService = {
      getDonationRequest: jest.fn()
    } as unknown as jest.Mocked<BloodDonationService>

    const userService = { getUser: jest.fn() } as unknown as jest.Mocked<UserService>

    const notificationService = {
      sendNotification: jest.fn(),
      getBloodDonationNotification: jest.fn(),
      createBloodDonationNotification: jest.fn(),
      updateBloodDonationNotificationStatus: jest.fn()
    } as unknown as jest.Mocked<NotificationService>

    const queueModel = {} as unknown as QueueModel

    beforeEach(() => {
      jest.resetAllMocks()
      acceptRepo.getAcceptedRequest.mockResolvedValue(acceptedRecord)
      acceptRepo.queryAcceptedRequests.mockResolvedValue([])
      bloodDonationService.getDonationRequest.mockResolvedValue(donationPost)
      notificationService.getBloodDonationNotification.mockResolvedValue(null)
      userService.getUser.mockImplementation(
        (id: string) => Promise.resolve(id === ignoredDonor ? donorProfile : seekerProfile)
      )
    })

    it('locks only the ignoring donor\'s channel, leaving other donors active', async() => {
      const chatOps = buildChatOps()
      const service = new AcceptDonationService(acceptRepo, mockLogger)

      await service.acceptDonationRequest(
        ignoredDonor,
        seekerId,
        requestPostId,
        createdAt,
        AcceptDonationStatus.IGNORED,
        bloodDonationService,
        userService,
        notificationService,
        queueModel,
        notificationQueueUrl,
        new ChatChannelService(chatOps)
      )

      expect(acceptRepo.deleteAcceptedRequest).toHaveBeenCalledWith(seekerId, requestPostId, ignoredDonor)
      expect(chatOps.lockChannel).toHaveBeenCalledTimes(1)
      expect(chatOps.lockChannel).toHaveBeenCalledWith(channelId(ignoredDonor))
      expect(chatOps.lockChannel).not.toHaveBeenCalledWith(channelId(donorB))
      expect(chatOps.listChannelsForRequest).not.toHaveBeenCalled()
    })
  })
})
