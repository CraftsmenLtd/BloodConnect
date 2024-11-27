import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import AcceptDonationRequestError from './AcceptDonationRequestError'
import {
  AcceptedDonationDTO
} from '../../../commons/dto/DonationDTO'
import Repository from '../models/policies/repositories/Repository'
import { AcceptDonationRequestAttributes } from './Types'

export class AcceptDonationService {
  async createAcceptanceRecord(
    acceptDonationRequestAttributes: AcceptDonationRequestAttributes,
    acceptDonationRequestRepository: Repository<AcceptedDonationDTO>
  ): Promise<string> {
    try {
      const acceptanceRecord: AcceptedDonationDTO = {
        ...acceptDonationRequestAttributes,
        status: 'PENDING',
        acceptanceTime: new Date().toISOString()
      }
      await acceptDonationRequestRepository.create(acceptanceRecord)
      return 'Donation request accepted successfully.'
    } catch (error: any) {
      if (error.code === 'ConditionalCheckFailedException') {
        return 'The request is complete'
      }
      throw new AcceptDonationRequestError(
        `Failed to accept donation request. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }
}
