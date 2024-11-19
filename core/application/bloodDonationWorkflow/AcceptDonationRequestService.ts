import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import AcceptDonationRequestError from './AcceptDonationRequestError'
import {
  AcceptedDonationDTO,
  DonationStatus
} from '../../../commons/dto/DonationDTO'
import Repository from '../models/policies/repositories/Repository'
import { AcceptDonationRequestAttributes } from './Types'
import { UserDetailsDTO } from '../../../commons/dto/UserDTO'

export class AcceptDonationService {
  async createAcceptanceRecord(
    acceptDonationRequestAttributes: AcceptDonationRequestAttributes,
    acceptDonationRequestRepository: Repository<AcceptedDonationDTO>,
    userRepository: Repository<UserDetailsDTO>
  ): Promise<string> {
    try {
      const { donorId, seekerId, createdAt, requestPostId } = acceptDonationRequestAttributes
      const queryResult = await acceptDonationRequestRepository.getItem(
        `BLOOD_REQ#${seekerId}`,
        `BLOOD_REQ#${createdAt}#${requestPostId}`
      )

      if (queryResult === null) {
        return 'Cannot find the donation request'
      }
      if (queryResult.status !== DonationStatus.PENDING) {
        return 'Donation request is no longer available for acceptance.'
      }

      const userProfile = await userRepository.getItem(
        `USER#${donorId}`,
        'PROFILE'
      )
      if (userProfile === null) {
        return 'Cannot find user'
      }

      const acceptanceRecord: AcceptedDonationDTO = {
        donorId: acceptDonationRequestAttributes.donorId,
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
