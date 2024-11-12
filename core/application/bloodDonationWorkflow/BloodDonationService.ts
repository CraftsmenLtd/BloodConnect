import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import ThrottlingError from './ThrottlingError'
import { AcceptedDonationDTO, DonationDTO, DonationStatus, DonorSearchDTO } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import Repository from '../technicalImpl/policies/repositories/Repository'
import { generateGeohash } from '../utils/geohash'
import { validateInputWithRules } from '../utils/validator'
import { BLOOD_REQUEST_PK_PREFIX, BloodDonationModel, DonationFields } from '../technicalImpl/dbModels/BloodDonationModel'
import { QueryConditionOperator, QueryInput } from '../technicalImpl/policies/repositories/QueryTypes'
import { BloodDonationAttributes, validationRules, UpdateBloodDonationAttributes, DonorRoutingAttributes, StepFunctionInput, DonationStatusManagerAttributes } from './Types'
import { StepFunctionModel } from '../technicalImpl/stepFunctions/StepFunctionModel'
import { THROTTLING_LIMITS } from '../../../commons/libs/constants/ThrottlingLimits'
import { DONOR_SEARCH_PK_PREFIX } from '../../application/technicalImpl/dbModels/DonorSearchModel'
import { AcceptDonationRequestModel, AcceptedDonationFields } from '../../application/technicalImpl/dbModels/AcceptDonationModel'

export class BloodDonationService {
  async createBloodDonation(donationAttributes: BloodDonationAttributes, bloodDonationRepository: Repository<DonationDTO, DonationFields>, model: BloodDonationModel): Promise<string> {
    try {
      await this.checkDailyRequestThrottling(donationAttributes.seekerId, bloodDonationRepository, model)

      const validationResponse = validateInputWithRules(
        { bloodQuantity: donationAttributes.bloodQuantity, donationDateTime: donationAttributes.donationDateTime },
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

  private async checkDailyRequestThrottling(seekerId: string, repository: Repository<DonationDTO, DonationFields>, model: BloodDonationModel): Promise<void> {
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
      throw new BloodDonationOperationError(`Failed to check request limits: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async updateBloodDonation(donationAttributes: UpdateBloodDonationAttributes, bloodDonationRepository: Repository<DonationDTO>): Promise<string> {
    try {
      const { requestPostId, donationDateTime, createdAt, ...restAttributes } = donationAttributes

      const item = await bloodDonationRepository.getItem(
        `${BLOOD_REQUEST_PK_PREFIX}#${donationAttributes.seekerId}`,
        `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
      )

      if (item === null) {
        throw new Error('Item not found.')
      }

      if (item?.status !== undefined && item.status === DonationStatus.COMPLETED) {
        throw new Error('You can\'t update a completed request')
      }

      const updateData: Partial<DonationDTO> = {
        ...restAttributes,
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

  async routeDonorRequest(
    donorRoutingAttributes: DonorRoutingAttributes,
    bloodDonationRepository: Repository<DonationDTO>,
    stepFunctionModel: StepFunctionModel,
    donorSearchRepository: Repository<DonorSearchDTO>
  ): Promise<string> {
    try {
      const { seekerId, requestPostId, createdAt } = donorRoutingAttributes
      const existingItem = await bloodDonationRepository.getItem(
        `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
        `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
      if (existingItem === null) {
        return 'Item not found.'
      }
      if (existingItem.status === DonationStatus.COMPLETED || existingItem.status === DonationStatus.EXPIRED) {
        return 'You can\'t update the donation request'
      }

      const donorSearchItem = await donorSearchRepository.getItem(
        `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
        `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
      if (donorSearchItem === null) {
        await donorSearchRepository.create(existingItem)
      }

      const retryCount = donorSearchItem?.retryCount ?? 0
      const updateData: Partial<DonationDTO> = {
        ...existingItem,
        id: requestPostId,
        retryCount: retryCount + 1
      }

      if (retryCount >= Number(process.env.MAX_RETRY_COUNT)) {
        await donorSearchRepository.update(updateData)
        await bloodDonationRepository.update(updateData)
        return 'The donor search process expired after the maximum retry limit is reached.'
      }

      await donorSearchRepository.update(updateData)

      const city = `${existingItem.location.split(',').pop()?.trim()}`
      const stepFunctionInput: StepFunctionInput = {
        seekerId,
        requestPostId,
        createdAt,
        donationDateTime: existingItem.donationDateTime,
        neededBloodGroup: existingItem.neededBloodGroup,
        bloodQuantity: existingItem.bloodQuantity,
        urgencyLevel: existingItem.urgencyLevel,
        geohash: existingItem.geohash,
        city: existingItem.city,
        retryCount: retryCount + 1
      }

      await stepFunctionModel.startExecution(stepFunctionInput, `${requestPostId}-${city}-(${existingItem.neededBloodGroup})-${Math.floor(Date.now() / 1000)}`)
      return 'We have updated your request and initiated the donor search process.'
    } catch (error) {
      throw new BloodDonationOperationError(`Failed to update blood donation post. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async updateDonationStatus(
    donationStatusManagerAttributes: DonationStatusManagerAttributes,
    bloodDonationRepository: Repository<DonationDTO>,
    acceptDonationRepository: Repository<AcceptedDonationDTO>
  ): Promise<string> {
    try {
      const { seekerId, requestPostId, createdAt } = donationStatusManagerAttributes
      const bloodReqItem = await bloodDonationRepository.getItem(
        `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
        `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
      if (bloodReqItem === null) {
        return 'Donation request not found.'
      }
      if (bloodReqItem.status === DonationStatus.COMPLETED || bloodReqItem.status === DonationStatus.EXPIRED) {
        return 'Can\'t update the donation request'
      }

      const acceptDonationModel = new AcceptDonationRequestModel()
      const primaryIndex = acceptDonationModel.getPrimaryIndex()
      const query: QueryInput<AcceptedDonationFields> = {
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
          attributeValue: `ACCEPTED#${requestPostId}`
        }
      }
      const queryResult = await acceptDonationRepository.query(query as QueryInput<Record<string, unknown>>)
      const acceptedItems = queryResult.items ?? []

      if (acceptedItems.length >= bloodReqItem.bloodQuantity) {
        bloodReqItem.status = DonationStatus.COMPLETED
        await bloodDonationRepository.update(bloodReqItem)
        return 'Donation request is complete.'
      }

      return 'More donors are needed to fulfill the blood quantity.'
    } catch (error) {
      throw new BloodDonationOperationError(
        `Failed to check donor numbers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GENERIC_CODES.ERROR
      )
    }
  }
}
