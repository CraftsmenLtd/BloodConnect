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
    queueSource: string,
    userProfile: UserDetailsDTO,
    donorSearchRepository: Repository<DonorSearchDTO>,
    stepFunctionModel: StepFunctionModel
  ): Promise<string> {
    const { seekerId, requestPostId, createdAt } = donorRoutingAttributes

    const donorSearchItem = await donorSearchRepository.getItem(
      `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
    )

    if (donorSearchItem === null) {
      await donorSearchRepository.create({
        id: donorRoutingAttributes.requestPostId,
        ...donorRoutingAttributes,
        status: DonationStatus.PENDING,
        retryCount: 0
      })
    } else if (donorSearchItem.status === DonationStatus.COMPLETED) {
      if (
        queueSource === process.env.DONOR_SEARCH_QUEUE_ARN &&
        donorRoutingAttributes.bloodQuantity > donorSearchItem.bloodQuantity
      ) {
        const updateData: Partial<DonorSearchDTO> = {
          ...donorRoutingAttributes,
          id: requestPostId,
          status: DonationStatus.PENDING,
          retryCount: 0
        }
        await donorSearchRepository.update(updateData)
      } else {
        return 'Donor search is completed'
      }
    }

    const retryCount = donorSearchItem?.retryCount ?? 0
    const updateData: Partial<DonorSearchDTO> = {
      ...donorRoutingAttributes,
      id: requestPostId,
      retryCount: retryCount + 1
    }

    if (retryCount >= Number(process.env.MAX_RETRY_COUNT)) {
      updateData.status = DonationStatus.COMPLETED
      await donorSearchRepository.update(updateData)
      return 'The donor search process completed after the maximum retry limit is reached.'
    }

    await donorSearchRepository.update(updateData)

    const stepFunctionInput: StepFunctionInput = {
      seekerId,
      requestPostId,
      createdAt,
      donationDateTime: donorRoutingAttributes.donationDateTime,
      neededBloodGroup: donorRoutingAttributes.neededBloodGroup,
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
        donorRoutingAttributes.neededBloodGroup,
        donorRoutingAttributes.shortDescription ?? ''
      )
    }

    await stepFunctionModel.startExecution(
      stepFunctionInput,
      `${requestPostId}-${donorRoutingAttributes.city}-(${donorRoutingAttributes.neededBloodGroup
      })-${Math.floor(Date.now() / 1000)}`
    )
    return 'We have updated your request and initiated the donor search process.'
  }

  async getDonorSearch(
    seekerId: string,
    createdAt: string,
    requestPostId: string,
    donorSearchRepository: Repository<DonorSearchDTO>
  ): Promise<DonorSearchDTO> {
    const donorSearchItem = await donorSearchRepository.getItem(
      `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
    if (donorSearchItem === null) {
      throw new Error('Donor search Item not found.')
    }
    return donorSearchItem
  }

  async updateDonorSearch(
    seekerId: string,
    createdAt: string,
    requestPostId: string,
    geohash: string,
    newCurrentNeighborGeohashes: string[],
    currentNeighborLevel: number,
    donorSearchRepository: Repository<DonorSearchDTO>
  ): Promise<string> {
    const updateData: Partial<DonorSearchDTO> = {
      id: requestPostId,
      seekerId,
      createdAt
    }
    if (newCurrentNeighborGeohashes.length === 0) {
      const newNeighborGeohashes = getGeohashNthNeighbors(
        geohash,
        currentNeighborLevel + 1
      )

      updateData.currentNeighborLevel = currentNeighborLevel + 1
      updateData.currentNeighborGeohashes = newNeighborGeohashes

      await donorSearchRepository.update(updateData)
    } else {
      updateData.currentNeighborLevel = currentNeighborLevel
      updateData.currentNeighborGeohashes = newCurrentNeighborGeohashes
      await donorSearchRepository.update(updateData)
    }
    return 'Donor Updated Successfully'
  }

  async queryGeohash(
    city: string,
    neededBloodGroup: string,
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
        attributeValue: `CITY#${city}#BG#${neededBloodGroup}#DONATIONSTATUS#yes`
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
