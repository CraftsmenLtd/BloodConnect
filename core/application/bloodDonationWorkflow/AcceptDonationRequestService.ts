import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import AcceptDonationRequestError from './AcceptDonationRequestError'
import {
  AcceptedDonationDTO
} from '../../../commons/dto/DonationDTO'
import Repository from '../models/policies/repositories/Repository'
import { AcceptDonationRequestAttributes } from './Types'
import { UserDetailsDTO } from '../../../commons/dto/UserDTO'

export class AcceptDonationService {
  async createAcceptanceRecord(
    acceptDonationRequestAttributes: AcceptDonationRequestAttributes,
    userProfile: UserDetailsDTO,
    acceptDonationRequestRepository: Repository<AcceptedDonationDTO>
  ): Promise<string> {
    try {
      const { donorId, seekerId, createdAt, requestPostId } = acceptDonationRequestAttributes
      const acceptanceRecord: AcceptedDonationDTO = {
        donorId,
        seekerId,
        createdAt,
        requestPostId,
        name: userProfile?.name,
        phoneNumbers: userProfile?.phoneNumbers,
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
