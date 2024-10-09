import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import { DonationDTO } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import Repository from '../technicalImpl/policies/repositories/Repository'

// TODO: add all the needed fields
type BloodDonationAttributes = {
  seekerId: string;
  bloodGroup: string;
  location: string;
  donationDateTime: Date;
}

export class BloodDonationService {
  async createBloodDonation(donationAttributes: BloodDonationAttributes, bloodDonationRepository: Repository<DonationDTO>): Promise<Partial<DonationDTO>> {
    try {
      return bloodDonationRepository.create({
        id: generateUniqueID(),
        seekerId: donationAttributes.seekerId,
        bloodGroup: donationAttributes.bloodGroup,
        location: donationAttributes.location,
        donationDateTime: new Date(donationAttributes.donationDateTime)
      })
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to update blood finding post. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async updateBloodDonation(donationAttributes: BloodDonationAttributes, bloodDonationRepository: Repository<DonationDTO>): Promise<Partial<DonationDTO>> {
    try {
      return bloodDonationRepository.update({
        id: generateUniqueID(),
        seekerId: donationAttributes.seekerId,
        bloodGroup: donationAttributes.bloodGroup,
        location: donationAttributes.location,
        donationDateTime: new Date(donationAttributes.donationDateTime)
      })
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to update blood finding post. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }
}
