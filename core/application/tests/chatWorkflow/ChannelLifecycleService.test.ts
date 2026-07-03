import { ChannelLifecycleService } from '../../chatWorkflow/ChannelLifecycleService'
import type { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import type { AcceptDonationService } from '../../bloodDonationWorkflow/AcceptDonationRequestService'
import type { ChatChannelService } from '../../chatWorkflow/ChatChannelService'
import type { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../../commons/dto/DonationDTO'
import { buildChannelId } from '../../chatWorkflow/Types'
import { mockLogger } from '../mocks/mockLogger'

const donationRequest = (): DonationDTO => ({
  requestPostId: 'req-1',
  seekerId: 'seeker-1',
  requestedBloodGroup: 'O+',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  countryCode: 'BD',
  location: 'Dhaka',
  latitude: 23.8,
  longitude: 90.4,
  h3Res5: 'h5',
  h3Res8: 'h8',
  donationDateTime: '2026-07-01T10:00:00.000Z',
  status: DonationStatus.PENDING,
  contactNumber: '+880000',
  createdAt: '2026-06-26T00:00:00.000Z'
})

describe('ChannelLifecycleService', () => {
  let service: ChannelLifecycleService

  beforeEach(() => {
    service = new ChannelLifecycleService(mockLogger)
  })

  describe('onAcceptanceAccepted', () => {
    it('builds the context snapshot from the request and ensures the channel', async () => {
      const bloodDonationService = {
        getDonationRequest: jest.fn().mockResolvedValue(donationRequest())
      } as unknown as BloodDonationService
      const channelService = {
        createChannelIfAbsent: jest.fn().mockResolvedValue({})
      } as unknown as ChatChannelService

      await service.onAcceptanceAccepted(
        { seekerId: 'seeker-1', requestPostId: 'req-1', donorId: 'donor-1', requestCreatedAt: '2026-06-26T00:00:00.000Z' },
        bloodDonationService,
        channelService
      )

      expect(bloodDonationService.getDonationRequest).toHaveBeenCalledWith(
        'seeker-1',
        'req-1',
        '2026-06-26T00:00:00.000Z'
      )
      expect(channelService.createChannelIfAbsent).toHaveBeenCalledWith({
        seekerId: 'seeker-1',
        requestPostId: 'req-1',
        donorId: 'donor-1',
        context: {
          requestedBloodGroup: 'O+',
          urgencyLevel: 'urgent',
          donationDateTime: '2026-07-01T10:00:00.000Z',
          location: 'Dhaka'
        }
      })
    })
  })

  describe('onRequestCompleted', () => {
    it('locks a channel for every accepted donor (fan-out)', async () => {
      const acceptDonationService = {
        getAcceptedDonorList: jest.fn().mockResolvedValue([
          { donorId: 'donor-1' },
          { donorId: 'donor-2' }
        ])
      } as unknown as AcceptDonationService
      const channelService = {
        lockChannel: jest.fn().mockResolvedValue(undefined)
      } as unknown as ChatChannelService

      await service.onRequestCompleted(
        { seekerId: 'seeker-1', requestPostId: 'req-1' },
        acceptDonationService,
        channelService
      )

      expect(channelService.lockChannel).toHaveBeenCalledTimes(2)
      expect(channelService.lockChannel).toHaveBeenCalledWith(buildChannelId('req-1', 'donor-1'))
      expect(channelService.lockChannel).toHaveBeenCalledWith(buildChannelId('req-1', 'donor-2'))
    })

    it('does nothing when there are no accepted donors', async () => {
      const acceptDonationService = {
        getAcceptedDonorList: jest.fn().mockResolvedValue([])
      } as unknown as AcceptDonationService
      const channelService = {
        lockChannel: jest.fn()
      } as unknown as ChatChannelService

      await service.onRequestCompleted(
        { seekerId: 'seeker-1', requestPostId: 'req-1' },
        acceptDonationService,
        channelService
      )

      expect(channelService.lockChannel).not.toHaveBeenCalled()
    })
  })
})
