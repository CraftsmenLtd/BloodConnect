import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import AcceptDonationRequestError from './AcceptDonationRequestError'
import { AcceptedDonationDTO, DonationStatus } from '../../../commons/dto/DonationDTO'
import Repository from '../technicalImpl/policies/repositories/Repository'
import { AcceptDonationRequestAttributes } from './Types'

export class AcceptDonationService {
  async createAcceptanceRecord(acceptDonationRequestAttributes: AcceptDonationRequestAttributes, acceptDonationRequestRepository: Repository<AcceptedDonationDTO>): Promise<string> {
    try {
      const { seekerId, createdAt, requestPostId } = acceptDonationRequestAttributes

      const queryResult = await acceptDonationRequestRepository.getItem(
        `BLOOD_REQ#${seekerId}`,
        `BLOOD_REQ#${createdAt}#${requestPostId}`
      )

      if (queryResult === null) {
        return 'Cannot find the donation request'
      }

      if (queryResult.status === DonationStatus.PENDING) {
        await acceptDonationRequestRepository.create({
          donorId: acceptDonationRequestAttributes.donorId,
          seekerId,
          createdAt,
          requestPostId,
          acceptanceTime: new Date().toISOString()
        })
        return 'Donation request accepted successfully.'
      } else {
        return 'Donation request is no longer available for acceptance.'
      }
    } catch (error) {
      throw new AcceptDonationRequestError(`Failed to accept donation request. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }
}
