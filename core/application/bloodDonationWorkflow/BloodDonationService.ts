import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import { DonationDTO } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import Repository from '../technicalImpl/policies/repositories/Repository'

// TODO: add all the needed fields
type BloodDonationAttributes = {
  phone: string;
  bloodGroup: string;
  location: string;
  donationDate: string;
}

export class BloodDonationService {
  async createBloodDonaiton(donationAttributes: BloodDonationAttributes, bloodDonaitonRepository: Repository<DonationDTO>): Promise<Partial<DonationDTO>> {
    try {
      return bloodDonaitonRepository.create({
        id: generateUniqueID(),
        phone: donationAttributes.phone,
        bloodGroup: donationAttributes.bloodGroup,
        location: donationAttributes.location,
        donationDate: new Date(donationAttributes.donationDate)
      })
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to update blood finding post. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async updateBloodDonaiton(donationAttributes: BloodDonationAttributes, bloodDonaitonRepository: Repository<DonationDTO>): Promise<Partial<DonationDTO>> {
    try {
      return bloodDonaitonRepository.update({
        id: generateUniqueID(),
        phone: donationAttributes.phone,
        bloodGroup: donationAttributes.bloodGroup,
        location: donationAttributes.location,
        donationDate: new Date(donationAttributes.donationDate)
      })
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to update blood finding post. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }
}
