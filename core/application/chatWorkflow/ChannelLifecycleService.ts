import type { Logger } from '../models/logger/Logger'
import type { BloodDonationService } from '../bloodDonationWorkflow/BloodDonationService'
import type { AcceptDonationService } from '../bloodDonationWorkflow/AcceptDonationRequestService'
import type { ChatChannelService } from './ChatChannelService'
import { buildChannelId } from './Types'

export type AcceptanceAcceptedInput = {
  seekerId: string;
  requestPostId: string;
  donorId: string;
  requestCreatedAt: string;
}

export type RequestCompletedInput = {
  seekerId: string;
  requestPostId: string;
}

export class ChannelLifecycleService {
  constructor(protected readonly logger: Logger) {}

  async onAcceptanceAccepted(
    input: AcceptanceAcceptedInput,
    bloodDonationService: BloodDonationService,
    channelService: ChatChannelService
  ): Promise<void> {
    const request = await bloodDonationService.getDonationRequest(
      input.seekerId,
      input.requestPostId,
      input.requestCreatedAt
    )
    await channelService.createChannelIfAbsent({
      seekerId: input.seekerId,
      requestPostId: input.requestPostId,
      donorId: input.donorId,
      context: {
        requestedBloodGroup: request.requestedBloodGroup,
        urgencyLevel: request.urgencyLevel,
        donationDateTime: request.donationDateTime,
        location: request.location
      }
    })
    this.logger.info('chat lifecycle: channel ensured on acceptance', {
      requestPostId: input.requestPostId
    })
  }

  async onRequestCompleted(
    input: RequestCompletedInput,
    acceptDonationService: AcceptDonationService,
    channelService: ChatChannelService
  ): Promise<void> {
    const acceptedDonors = await acceptDonationService.getAcceptedDonorList(
      input.seekerId,
      input.requestPostId
    )
    for (const donor of acceptedDonors) {
      await channelService.lockChannel(buildChannelId(input.requestPostId, donor.donorId))
    }
    this.logger.info('chat lifecycle: channels locked on completion', {
      requestPostId: input.requestPostId,
      lockedCount: acceptedDonors.length
    })
  }
}
