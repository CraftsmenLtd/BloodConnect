import { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import { DonationStatus } from '../../../../commons/dto/DonationDTO'
import { mockLogger } from '../mocks/mockLogger'
import type { ChatService } from '../../chatWorkflow/ChatService'
import type { DonationRecordService } from '../../bloodDonationWorkflow/DonationRecordService'
import type { UserService } from '../../userWorkflow/UserService'
import type { NotificationService } from '../../notificationWorkflow/NotificationService'
import type { LocationService } from '../../userWorkflow/LocationService'
import type { QueueModel } from '../../models/queue/QueueModel'

const donationPost = {
  seekerId: 'seeker-1',
  requestPostId: 'req-1',
  createdAt: '2026-06-26T00:00:00.000Z',
  requestedBloodGroup: 'O+',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  location: 'Dhaka',
  donationDateTime: '2026-06-30T10:00:00.000Z',
  status: DonationStatus.PENDING
}

const buildRepository = () => ({
  getDonationRequest: jest.fn().mockResolvedValue(donationPost),
  update: jest.fn().mockResolvedValue(donationPost),
  create: jest.fn(),
  query: jest.fn(),
  getItem: jest.fn(),
  delete: jest.fn()
})

const buildChatService = () => ({
  lockChannel: jest.fn().mockResolvedValue(undefined),
  lockChannelsForRequest: jest.fn().mockResolvedValue(undefined)
} as unknown as jest.Mocked<ChatService>)

describe('BloodDonationService chat-channel locking hooks', () => {
  describe('updateDonationStatus', () => {
    test.each([DonationStatus.CANCELLED, DonationStatus.EXPIRED])(
      'locks all of a request\'s channels on %s',
      async(status) => {
        const repository = buildRepository()
        const chatService = buildChatService()
        const service = new BloodDonationService(repository as never, mockLogger, chatService)

        await service.updateDonationStatus('seeker-1', 'req-1', donationPost.createdAt, status)

        expect(chatService.lockChannelsForRequest).toHaveBeenCalledWith('seeker-1', 'req-1')
      }
    )

    test.each([DonationStatus.PENDING, DonationStatus.MANAGED])(
      'does not lock channels on a non-terminal transition (%s)',
      async(status) => {
        const repository = buildRepository()
        const chatService = buildChatService()
        const service = new BloodDonationService(repository as never, mockLogger, chatService)

        await service.updateDonationStatus('seeker-1', 'req-1', donationPost.createdAt, status)

        expect(chatService.lockChannelsForRequest).not.toHaveBeenCalled()
      }
    )

    test('is a no-op for locking when no chatService is injected', async() => {
      const repository = buildRepository()
      const service = new BloodDonationService(repository as never, mockLogger)

      await expect(
        service.updateDonationStatus('seeker-1', 'req-1', donationPost.createdAt, DonationStatus.CANCELLED)
      ).resolves.toBeUndefined()
    })
  })

  describe('completeDonationRequest', () => {
    test('locks each donor\'s channel on completion', async() => {
      const repository = buildRepository()
      const chatService = buildChatService()
      const service = new BloodDonationService(repository as never, mockLogger, chatService)

      const donationRecordService = {
        createDonationRecord: jest.fn().mockResolvedValue(undefined)
      } as unknown as jest.Mocked<DonationRecordService>
      const userService = {
        updateUserAttributes: jest.fn().mockResolvedValue(undefined)
      } as unknown as jest.Mocked<UserService>
      const notificationService = {
        updateBloodDonationNotificationStatus: jest.fn().mockResolvedValue(undefined),
        sendNotification: jest.fn().mockResolvedValue(undefined)
      } as unknown as jest.Mocked<NotificationService>
      const locationService = {} as unknown as jest.Mocked<LocationService>
      const queueModel = { queue: jest.fn() } as unknown as jest.Mocked<QueueModel>

      await service.completeDonationRequest(
        'seeker-1',
        'req-1',
        donationPost.createdAt,
        ['donor-1', 'donor-2'],
        donationRecordService,
        userService,
        notificationService,
        locationService,
        3,
        queueModel,
        'queue-url'
      )

      expect(chatService.lockChannel).toHaveBeenCalledTimes(2)
      expect(chatService.lockChannel).toHaveBeenCalledWith('seeker-1', 'req-1', 'donor-1')
      expect(chatService.lockChannel).toHaveBeenCalledWith('seeker-1', 'req-1', 'donor-2')
      // Completion locks per-donor, not via the request-wide path.
      expect(chatService.lockChannelsForRequest).not.toHaveBeenCalled()
    })
  })
})
