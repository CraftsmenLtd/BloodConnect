import { generateUniqueID } from '../utils/idGenerator'
import type { DonationRecordAttributes } from './Types'
import type DonationRecordRepository from '../models/policies/repositories/DonationRecordRepository'
import type { Logger } from '../models/logger/Logger'

export class DonationRecordService {
  constructor(
    protected readonly DonationRecordRepository: DonationRecordRepository,
    protected readonly logger: Logger
  ) { }

  async createDonationRecord(
    donationRecordAttributes: DonationRecordAttributes
  ): Promise<void> {
    await this.DonationRecordRepository.create({
      id: generateUniqueID(),
      donorId: donationRecordAttributes.donorId,
      seekerId: donationRecordAttributes.seekerId,
      requestPostId: donationRecordAttributes.requestPostId,
      requestCreatedAt: donationRecordAttributes.requestCreatedAt,
      requestedBloodGroup: donationRecordAttributes.requestedBloodGroup,
      location: donationRecordAttributes.location,
      donationDateTime: donationRecordAttributes.donationDateTime,
      createdAt: new Date().toISOString()
    })
  }
}
