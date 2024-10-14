import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import { DonationDTO } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import Repository from '../technicalImpl/policies/repositories/Repository'
import { generateGeohash } from '../utils/geohash'
import { validateInputWithRules } from '../utils/validator'
import { BloodDonationAttributes, validationRules, UpdateBloodDonationAttributes } from './Types'

export class BloodDonationService {
  async createBloodDonation(donationAttributes: BloodDonationAttributes, bloodDonationRepository: Repository<DonationDTO>): Promise<string> {
    try {
      const validationResponse = validateInputWithRules({ bloodQuantity: donationAttributes.bloodQuantity, donationDateTime: donationAttributes.donationDateTime }, validationRules)
      if (validationResponse !== null) {
        return validationResponse
      }
      await bloodDonationRepository.create({
        id: generateUniqueID(),
        ...donationAttributes,
        status: 'accepted',
        geohash: generateGeohash(donationAttributes.latitude, donationAttributes.longitude),
        donationDateTime: new Date(donationAttributes.donationDateTime).toISOString()
      })
      return 'We have accepted you request we will let you know when we will found donar.'
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to submit blood donation request. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async updateBloodDonation(donationAttributes: UpdateBloodDonationAttributes, bloodDonationRepository: Repository<DonationDTO>): Promise<string> {
    try {
      const { requestPostId, donationDateTime, ...restAttributes } = donationAttributes

      const item = await bloodDonationRepository.getItem(`BLOOD_REQ#${donationAttributes.seekerId}`, `BLOOD_REQ#${requestPostId}`)
      if (item === null) {
        return 'No item found.'
      }
      if (item?.status !== undefined && item.status === 'completed') {
        return 'This request is completed you can\'t update'
      }
      const updateData: Partial<DonationDTO> = {
        ...restAttributes,
        id: requestPostId
      }
      if (donationDateTime !== undefined) {
        updateData.donationDateTime = new Date(donationDateTime).toISOString()
        const validationResponse = validateInputWithRules({ donationDateTime }, validationRules)
        if (validationResponse !== null) {
          return validationResponse
        }
      }
      await bloodDonationRepository.update(updateData)
      return 'We have updated your request, we will let you know update.'
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to update blood donation post. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }
}
