import type { DonationRecordDTO } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import type { DonationRecordFields } from '../models/dbModels/DonationRecordModel'
import type { DonationRecordAttributes } from './Types'
import type DonationRecordRepository from '../models/policies/repositories/DonationRecordRepository'

export class DonationRecordService {
  async createDonationRecord(
    donationRecordAttributes: DonationRecordAttributes,
    DonationRecordRepository: DonationRecordRepository<DonationRecordDTO, DonationRecordFields>
  ): Promise<void> {
    await DonationRecordRepository.create({
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
