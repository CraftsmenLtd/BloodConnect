import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import ThrottlingError from './ThrottlingError'
import type { DonationDTO } from '../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import type Repository from '../models/policies/repositories/Repository'
import { generateGeohash } from '../utils/geohash'
import { validateInputWithRules } from '../utils/validator'
import type {
  BloodDonationModel,
  DonationFields
} from '../models/dbModels/BloodDonationModel';
import {
  BLOOD_REQUEST_PK_PREFIX
} from '../models/dbModels/BloodDonationModel'
import type { QueryInput } from '../models/policies/repositories/QueryTypes';
import { QueryConditionOperator } from '../models/policies/repositories/QueryTypes'
import type {
  BloodDonationAttributes,
  UpdateBloodDonationAttributes,
  BloodDonationResponseAttributes
} from './Types';
import {
  validationRules
} from './Types'
import { THROTTLING_LIMITS } from '../../../commons/libs/constants/ThrottlingLimits'
import type BloodDonationRepository from '../models/policies/repositories/BloodDonationRepository'

export class BloodDonationService {
  async createBloodDonation(
    donationAttributes: BloodDonationAttributes,
    bloodDonationRepository: Repository<DonationDTO, DonationFields>,
    model: BloodDonationModel
  ): Promise<BloodDonationResponseAttributes> {
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
      throw new BloodDonationOperationError(
        `Invalid parameters for blood donation request. ${validationResponse}`,
        GENERIC_CODES.BAD_REQUEST
      )
    }

    const response: DonationDTO = await bloodDonationRepository
      .create({
        requestPostId: generateUniqueID(),
        ...donationAttributes,
        status: DonationStatus.PENDING,
        geohash: generateGeohash(donationAttributes.latitude, donationAttributes.longitude),
        donationDateTime: new Date(donationAttributes.donationDateTime).toISOString(),
        createdAt: new Date().toISOString()
      })
      .catch((error) => {
        if (error instanceof ThrottlingError) {
          throw error
        }
        throw new BloodDonationOperationError(
          `Failed to submit blood donation request. ${error}`,
          GENERIC_CODES.ERROR
        )
      })

    return {
      requestPostId: response.requestPostId,
      createdAt: response.createdAt
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

    if (primaryIndex.sortKey !== undefined) {
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
  ): Promise<BloodDonationResponseAttributes> {
    const { seekerId, requestPostId, donationDateTime, createdAt, ...restAttributes } =
      donationAttributes
    const item = await bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )

    if (item === null) {
      throw new BloodDonationOperationError('Item not found.', GENERIC_CODES.NOT_FOUND)
    }

    if (item?.status !== undefined && item.status === DonationStatus.CANCELLED) {
      throw new BloodDonationOperationError(
        'You can\'t update a cancelled request',
        GENERIC_CODES.ERROR
      )
    }

    const updateData: Partial<DonationDTO> = {
      ...restAttributes,
      seekerId,
      requestPostId,
      createdAt
    }

    if (donationDateTime !== undefined) {
      const validationResponse = validateInputWithRules({ donationDateTime }, validationRules)
      if (validationResponse !== null) {
        throw new Error(validationResponse)
      }
      updateData.donationDateTime = new Date(donationDateTime).toISOString()
    }

    await bloodDonationRepository.update(updateData).catch((error) => {
      if (error instanceof BloodDonationOperationError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to update blood donation post. ${error}`,
        GENERIC_CODES.ERROR
      )
    })
    return {
      requestPostId,
      createdAt
    }
  }

  async updateDonationStatus(
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    status: DonationStatus,
    bloodDonationRepository: BloodDonationRepository<DonationDTO>
  ): Promise<void> {
    const item = await bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )
    if (item === null) {
      throw new Error('Donation not found.')
    }
    const updateData: Partial<DonationDTO> = {
      ...item,
      seekerId,
      requestPostId,
      createdAt,
      status
    }
    await bloodDonationRepository.update(updateData)
  }
}
