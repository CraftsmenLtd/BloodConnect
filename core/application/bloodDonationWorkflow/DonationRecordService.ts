import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import DonationRecordOperationError from './DonationRecordOperationError'
import ThrottlingError from './ThrottlingError'
import { DonationRecordDTO } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { DonationRecordFields } from '../models/dbModels/DonationRecordModel'
import { DonationRecordAttributes } from './Types'
import DonationRecordRepository from '../models/policies/repositories/DonationRecordRepository'

export class DonationRecordService {
  async createDonationRecord(
    donationRecordAttributes: DonationRecordAttributes,
    DonationRecordRepository: DonationRecordRepository<DonationRecordDTO, DonationRecordFields>
  ): Promise<void> {
    try {
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
    } catch (error) {
      if (error instanceof ThrottlingError) {
        throw error
      }
      throw new DonationRecordOperationError(
        `Failed to submit donation record. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }
}
