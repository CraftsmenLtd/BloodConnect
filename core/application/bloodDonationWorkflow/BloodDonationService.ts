import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import ThrottlingError from './ThrottlingError'
import { DonationDTO, DonationStatus } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import Repository from '../models/policies/repositories/Repository'
import { generateGeohash } from '../utils/geohash'
import { validateInputWithRules } from '../utils/validator'
import {
  BLOOD_REQUEST_PK_PREFIX,
  BloodDonationModel,
  DonationFields
} from '../models/dbModels/BloodDonationModel'
import { QueryConditionOperator, QueryInput } from '../models/policies/repositories/QueryTypes'
import { BloodDonationAttributes, validationRules, UpdateBloodDonationAttributes } from './Types'
import { THROTTLING_LIMITS } from '../../../commons/libs/constants/ThrottlingLimits'
import BloodDonationRepository from '../models/policies/repositories/BloodDonationRepository'

export class BloodDonationService {
  async createBloodDonation(
    donationAttributes: BloodDonationAttributes,
    bloodDonationRepository: Repository<DonationDTO, DonationFields>,
    model: BloodDonationModel
  ): Promise<string> {
    try {
      await this.checkDailyRequestThrottling(
        donationAttributes.seekerId,
        bloodDonationRepository,
        model
      )

      const validationResponse = validateInputWithRules(
        {
          bloodQuantity: donationAttributes.bloodQuantity,
          donationDateTime: donationAttributes.donationDateTime
        },
        validationRules
      )
      if (validationResponse !== null) {
        throw new Error(validationResponse)
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
      if (error instanceof ThrottlingError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to submit blood donation request. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  private async checkDailyRequestThrottling(
    seekerId: string,
    repository: Repository<DonationDTO, DonationFields>,
    model: BloodDonationModel
  ): Promise<void> {
    const datePrefix = new Date().toISOString().split('T')[0]
    const primaryIndex = model.getPrimaryIndex()

    const query: QueryInput<DonationFields> = {
      partitionKeyCondition: {
        attributeName: primaryIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`
      }
    }

    if (primaryIndex.sortKey != null) {
      query.sortKeyCondition = {
        attributeName: primaryIndex.sortKey,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${datePrefix}`
      }
    }

    try {
      const queryResult = await repository.query(query)
      if (queryResult.items.length >= THROTTLING_LIMITS.BLOOD_REQUEST.MAX_REQUESTS_PER_DAY) {
        throw new ThrottlingError(
          THROTTLING_LIMITS.BLOOD_REQUEST.ERROR_MESSAGE,
          GENERIC_CODES.TOO_MANY_REQUESTS
        )
      }
    } catch (error) {
      if (error instanceof ThrottlingError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to check request limits: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async getDonationRequest(
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    bloodDonationRepository: BloodDonationRepository<DonationDTO>
  ): Promise<DonationDTO> {
    const item = await bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )
    if (item === null) {
      throw new Error('Donation not found.')
    }
    return item
  }

  async updateBloodDonation(
    donationAttributes: UpdateBloodDonationAttributes,
    bloodDonationRepository: BloodDonationRepository<DonationDTO>
  ): Promise<string> {
    try {
      const { seekerId, requestPostId, donationDateTime, createdAt, ...restAttributes } =
        donationAttributes
      const item = await bloodDonationRepository.getDonationRequest(
        seekerId,
        requestPostId,
        createdAt
      )

      if (item === null) {
        throw new Error('Item not found.')
      }

      if (item?.status !== undefined && item.status === DonationStatus.CANCELLED) {
        throw new Error("You can't update a completed request")
      }

      const updateData: Partial<DonationDTO> = {
        ...restAttributes,
        seekerId,
        id: requestPostId,
        createdAt
      }

      if (donationDateTime !== undefined) {
        const validationResponse = validateInputWithRules({ donationDateTime }, validationRules)
        if (validationResponse !== null) {
          throw new Error(validationResponse)
        }
        updateData.donationDateTime = new Date(donationDateTime).toISOString()
      }

      await bloodDonationRepository.update(updateData)
      return 'We have updated your request and will let you know once there is an update.'
    } catch (error) {
      if (error instanceof BloodDonationOperationError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to update blood donation post. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async updateDonationStatus(
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    status: DonationStatus,
    bloodDonationRepository: BloodDonationRepository<DonationDTO>
  ): Promise<void> {
    const updateData: Partial<DonationDTO> = {
      seekerId,
      id: requestPostId,
      createdAt,
      status
    }
    await bloodDonationRepository.update(updateData)
  }

  async updateDonationPostStatus(
    donationStatusManagerAttributes: DonationStatusManagerAttributes,
    bloodDonationRepository: Repository<DonationDTO>
  ): Promise<void> {
    const { seekerId, requestPostId, createdAt } = donationStatusManagerAttributes

    await bloodDonationRepository.update({
      id: requestPostId,
      seekerId,
      createdAt,
      status: DonationStatus.CANCELLED
    }).catch((error) => {
      throw error
    })
  }
}
