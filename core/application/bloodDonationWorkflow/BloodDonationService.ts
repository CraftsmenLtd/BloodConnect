import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import { DonationDTO, DonationStatus } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import Repository from '../technicalImpl/policies/repositories/Repository'
import { generateGeohash } from '../utils/geohash'
import { validateInputWithRules } from '../utils/validator'
import { BloodDonationAttributes, validationRules, UpdateBloodDonationAttributes, DonorRoutingAttributes, StepFunctionInput } from './Types'
import { StepFunctionModel } from '../technicalImpl/stepFunctions/StepFunctionModel'
import { BLOOD_REQUEST_PK_PREFIX } from '../technicalImpl/dbModels/BloodDonationModel'

const MAX_RETRY_COUNT = Number(process.env.MAX_RETRY_COUNT)

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
        status: DonationStatus.PENDING,
        geohash: generateGeohash(donationAttributes.latitude, donationAttributes.longitude),
        donationDateTime: new Date(donationAttributes.donationDateTime).toISOString()
      })
      return 'We have accepted your request, and we will let you know when we find a donor.'
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to submit blood donation request. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async updateBloodDonation(donationAttributes: UpdateBloodDonationAttributes, bloodDonationRepository: Repository<DonationDTO>): Promise<string> {
    try {
      const { requestPostId, donationDateTime, ...restAttributes } = donationAttributes

      const item = await bloodDonationRepository.getItem(`BLOOD_REQUEST_PK_PREFIX#${donationAttributes.seekerId}`, `BLOOD_REQUEST_PK_PREFIX#${requestPostId}`)
      if (item === null) {
        return 'Item not found.'
      }
      if (item?.status !== undefined && item.status === DonationStatus.COMPLETED) {
        return 'You can\'t update a completed request'
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
      return 'We have updated your request and will let you know once there is an update.'
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to update blood donation post. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async routeDonorRequest(
    donorRoutingAttributes: DonorRoutingAttributes,
    bloodDonationRepository: Repository<DonationDTO>,
    stepFunctionModel: StepFunctionModel
  ): Promise<string> {
    try {
      const { seekerId, requestPostId } = donorRoutingAttributes

      const existingItem = await bloodDonationRepository.getItem(`${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`, `${BLOOD_REQUEST_PK_PREFIX}#${requestPostId}`)
      if (existingItem === null) {
        return 'Item not found.'
      }
      if (existingItem?.status !== undefined && existingItem.status === DonationStatus.COMPLETED) {
        return 'You can\'t update the donation request'
      }
      const retryCount = existingItem?.retryCount ?? 0

      if (retryCount >= MAX_RETRY_COUNT) {
        const updateData: Partial<DonationDTO> = {
          ...existingItem,
          id: requestPostId,
          status: DonationStatus.EXPIRED,
          retryCount: retryCount + 1
        }
        await bloodDonationRepository.update(updateData)
        return 'Donor search expired after max retries.'
      }

      const stepFunctionInput: StepFunctionInput = {
        seekerId: donorRoutingAttributes.seekerId,
        requestPostId: donorRoutingAttributes.requestPostId,
        neededBloodGroup: existingItem.neededBloodGroup,
        bloodQuantity: existingItem.bloodQuantity,
        urgencyLevel: existingItem.urgencyLevel,
        latitude: existingItem.latitude,
        longitude: existingItem.longitude
      }

      await stepFunctionModel.startExecution(stepFunctionInput)
      return 'We have updated your request and initiated the donor search process.'
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to update blood donation post. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }
}
