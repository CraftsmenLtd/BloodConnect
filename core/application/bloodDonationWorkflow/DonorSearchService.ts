import {
  DonationStatus,
  DonorSearchDTO
} from '../../../commons/dto/DonationDTO'
import Repository from '../models/policies/repositories/Repository'
import { getGeohashNthNeighbors } from '../utils/geohash'
import {
  QueryConditionOperator,
  QueryInput
} from '../models/policies/repositories/QueryTypes'
import {
  DonorRoutingAttributes,
  StepFunctionInput
} from './Types'
import { StepFunctionModel } from '../models/stepFunctions/StepFunctionModel'
import { DONOR_SEARCH_PK_PREFIX } from '../models/dbModels/DonorSearchModel'
import { AcceptedDonationFields } from '../models/dbModels/AcceptDonationModel'
import { LocationDTO, UserDetailsDTO } from '../../../commons/dto/UserDTO'
import { getBloodRequestMessage } from './BloodDonationMessages'
import LocationModel from '../models/dbModels/LocationModel'

export class DonorSearchService {
  async routeDonorRequest(
    donorRoutingAttributes: DonorRoutingAttributes,
    sourceQueueArn: string,
    userProfile: UserDetailsDTO,
    donorSearchRepository: Repository<DonorSearchDTO>,
    stepFunctionModel: StepFunctionModel
  ): Promise<void> {
    const { seekerId, requestPostId, createdAt } = donorRoutingAttributes

    const donorSearchRecord = await donorSearchRepository.getItem(
      `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
    )

    if (donorSearchRecord === null) {
      await donorSearchRepository.create({
        id: donorRoutingAttributes.requestPostId,
        ...donorRoutingAttributes,
        status: DonationStatus.PENDING,
        retryCount: 0
      })
    }
		const isDonationUpdateRequest = sourceQueueArn === process.env.DONOR_SEARCH_QUEUE_ARN &&
			donorSearchRecord !== null &&
			donorRoutingAttributes.bloodQuantity > donorSearchRecord.bloodQuantity
    const hasDonationCompleted = donorSearchRecord !== null && donorSearchRecord.status === DonationStatus.COMPLETED

    if (hasDonationCompleted && !isDonationUpdateRequest) {
      return
    }

    if (hasDonationCompleted && isDonationUpdateRequest) {
      await donorSearchRepository.update({
        ...donorRoutingAttributes,
        id: requestPostId,
        status: DonationStatus.PENDING,
        retryCount: 0
      })
    }

    const retryCount = donorSearchRecord?.retryCount ?? 0
    const updatedRecord: Partial<DonorSearchDTO> = {
      ...donorRoutingAttributes,
      id: requestPostId,
      retryCount: retryCount + 1
    }
    const hasRetryCountExceeded = retryCount >= Number(process.env.MAX_RETRY_COUNT)
    if (hasRetryCountExceeded) {
      updatedRecord.status = DonationStatus.COMPLETED
      await donorSearchRepository.update(updatedRecord)
      return
    }

    await donorSearchRepository.update(updatedRecord)

    const stepFunctionPayload: StepFunctionInput = {
      seekerId,
      requestPostId,
      createdAt,
      donationDateTime: donorRoutingAttributes.donationDateTime,
      requestedBloodGroup: donorRoutingAttributes.requestedBloodGroup,
      bloodQuantity: Number(donorRoutingAttributes.bloodQuantity),
      urgencyLevel: donorRoutingAttributes.urgencyLevel,
      geohash: donorRoutingAttributes.geohash,
      seekerName: userProfile.name,
      patientName: donorRoutingAttributes.patientName ?? '',
      location: donorRoutingAttributes.location,
      contactNumber: donorRoutingAttributes.contactNumber,
      transportationInfo: donorRoutingAttributes.transportationInfo ?? '',
      shortDescription: donorRoutingAttributes.shortDescription ?? '',
      city: donorRoutingAttributes.city,
      retryCount: retryCount + 1,
      message: getBloodRequestMessage(
        donorRoutingAttributes.urgencyLevel,
        donorRoutingAttributes.requestedBloodGroup,
        donorRoutingAttributes.shortDescription ?? ''
      )
    }

    await stepFunctionModel.startExecution(
      stepFunctionPayload,
      `${requestPostId}-${donorRoutingAttributes.city}-(${donorRoutingAttributes.requestedBloodGroup})-${Math.floor(Date.now() / 1000)}`
    )
  }

  async getDonorSearch(
    seekerId: string,
    createdAt: string,
    requestPostId: string,
    donorSearchRepository: Repository<DonorSearchDTO>
  ): Promise<DonorSearchDTO> {
    const donorSearchRecord = await donorSearchRepository.getItem(
      `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
    if (donorSearchRecord === null) {
      throw new Error('Donor search record not found.')
    }
    return donorSearchRecord
  }

  async updateDonorSearch(
    seekerId: string,
    createdAt: string,
    requestPostId: string,
    geohash: string,
    remainingGeohashesToProcess: string[],
    currentNeighborSearchLevel: number,
    donorSearchRepository: Repository<DonorSearchDTO>
  ): Promise<void> {
    const updatedRecord: Partial<DonorSearchDTO> = {
      id: requestPostId,
      seekerId,
      createdAt
    }
    if (remainingGeohashesToProcess.length === 0) {
      const newNeighborGeohashes = getGeohashNthNeighbors(geohash, currentNeighborSearchLevel + 1)
      updatedRecord.currentNeighborSearchLevel = currentNeighborSearchLevel + 1
      updatedRecord.remainingGeohashesToProcess = newNeighborGeohashes
    } else {
      updatedRecord.currentNeighborSearchLevel = currentNeighborSearchLevel
      updatedRecord.remainingGeohashesToProcess = remainingGeohashesToProcess
    }
    await donorSearchRepository.update(updatedRecord)
  }

  async queryGeohash(
    city: string,
    requestedBloodGroup: string,
    geohash: string,
    locationRepository: Repository<LocationDTO, Record<string, unknown>>
  ): Promise<LocationDTO[]> {
    const locationModel = new LocationModel()
    const gsiIndex = locationModel.getIndex('GSI', 'GSI1')
    if (gsiIndex === undefined) {
      throw new Error('Index not found.')
    }

    const query: QueryInput<AcceptedDonationFields> = {
      partitionKeyCondition: {
        attributeName: gsiIndex.partitionKey as keyof AcceptedDonationFields,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `CITY#${city}#BG#${requestedBloodGroup}#DONATIONSTATUS#yes`
      }
    }

    if (gsiIndex.sortKey != null && geohash.length > 0) {
      query.sortKeyCondition = {
        attributeName: gsiIndex.sortKey as keyof AcceptedDonationFields,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: geohash
      }
    }
    const queryResult = await locationRepository.query(
      query as QueryInput<Record<string, unknown>>, 'GSI1'
    )
    const donorsFoundList = queryResult.items ?? []
    return donorsFoundList
  }
}
