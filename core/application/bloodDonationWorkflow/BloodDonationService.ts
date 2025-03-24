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
import {
  BloodDonationAttributes,
  validationRules,
  UpdateBloodDonationAttributes,
  BloodDonationResponseAttributes,
  BloodDonationEventAttributes
} from './Types'
import { THROTTLING_LIMITS } from '../../../commons/libs/constants/ThrottlingLimits'
import BloodDonationRepository from '../models/policies/repositories/BloodDonationRepository'
import { UserService } from '../userWorkflow/UserService'
import { UserDetailsDTO } from 'commons/dto/UserDTO'

export class BloodDonationService {
  async createBloodDonation(
    donationEventAttributes: BloodDonationEventAttributes,
    bloodDonationRepository: Repository<DonationDTO, DonationFields>,
    model: BloodDonationModel,
    userService: UserService,
    userRepository: Repository<UserDetailsDTO>
  ): Promise<BloodDonationResponseAttributes> {
    const userProfile = await userService.getUser(
      donationEventAttributes.seekerId,
      userRepository
    )
    const bloodDonationAttributes: BloodDonationAttributes = {
      ...donationEventAttributes,
      seekerName: userProfile.name,
      countryCode: userProfile.countryCode
    }
    await this.checkDailyRequestThrottling(
      bloodDonationAttributes.seekerId,
      bloodDonationRepository,
      model
    )

    const validationResponse = validateInputWithRules(
      {
        bloodQuantity: bloodDonationAttributes.bloodQuantity,
        donationDateTime: bloodDonationAttributes.donationDateTime
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
        ...bloodDonationAttributes,
        status: DonationStatus.PENDING,
        geohash: generateGeohash(bloodDonationAttributes.latitude, bloodDonationAttributes.longitude),
        donationDateTime: new Date(bloodDonationAttributes.donationDateTime).toISOString(),
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
