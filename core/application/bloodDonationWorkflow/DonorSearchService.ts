import { DonationStatus, DonorSearchDTO } from '../../../commons/dto/DonationDTO'
import Repository from '../models/policies/repositories/Repository'
import { getGeohashNthNeighbors } from '../utils/geohash'
import { DonorRoutingAttributes, StepFunctionInput } from './Types'
import { StepFunctionModel } from '../models/stepFunctions/StepFunctionModel'
import { DONOR_SEARCH_PK_PREFIX } from '../models/dbModels/DonorSearchModel'
import { LocationDTO, UserDetailsDTO } from '../../../commons/dto/UserDTO'
import { getBloodRequestMessage } from './BloodDonationMessages'
import GeohashRepository from '../models/policies/repositories/GeohashRepository'

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
      await this.createDonorSearchRecord(donorRoutingAttributes, donorSearchRepository)
    }

    const hasDonationCompleted = donorSearchRecord !== null &&
      donorSearchRecord.status === DonationStatus.COMPLETED

    const restartSearch = this.shouldRestartSearch(
      sourceQueueArn,
      donorSearchRecord,
      donorRoutingAttributes
    )
    if (hasDonationCompleted && !restartSearch) {
      return
    }

    const updatedRecord: Partial<DonorSearchDTO> = {
      ...donorRoutingAttributes,
      retryCount: donorSearchRecord?.retryCount ?? 0
    }

    if (restartSearch) {
      updatedRecord.status = DonationStatus.PENDING
      updatedRecord.currentNeighborSearchLevel = 0
      updatedRecord.remainingGeohashesToProcess = []
      updatedRecord.retryCount = 0
    }

    const newRetryCount = (updatedRecord?.retryCount ?? 0) + 1
    updatedRecord.retryCount = newRetryCount

    if (newRetryCount >= Number(process.env.MAX_RETRY_COUNT)) {
      updatedRecord.status = DonationStatus.COMPLETED
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
      retryCount: newRetryCount,
      message: getBloodRequestMessage(
        donorRoutingAttributes.urgencyLevel,
        donorRoutingAttributes.requestedBloodGroup,
        donorRoutingAttributes.shortDescription ?? ''
      )
    }

    await stepFunctionModel.startExecution(
      stepFunctionPayload,
      `${requestPostId}-${donorRoutingAttributes.city}-(${donorRoutingAttributes.requestedBloodGroup
      })-${Math.floor(Date.now() / 1000)}`
    )
  }

  private shouldRestartSearch(
    sourceQueueArn: string,
    donorSearchRecord: DonorSearchDTO | null,
    donorRoutingAttributes: DonorRoutingAttributes
  ): boolean {
    return (
      sourceQueueArn === process.env.DONOR_SEARCH_QUEUE_ARN &&
      donorSearchRecord !== null &&
      (donorRoutingAttributes.bloodQuantity > donorSearchRecord.bloodQuantity ||
        donorRoutingAttributes.donationDateTime !== donorSearchRecord.donationDateTime)
    )
  }

  private async createDonorSearchRecord(
    donorRoutingAttributes: DonorRoutingAttributes,
    donorSearchRepository: Repository<DonorSearchDTO, Record<string, unknown>>
  ): Promise<void> {
    await donorSearchRepository.create({
      ...donorRoutingAttributes,
      status: DonationStatus.PENDING,
      retryCount: 0
    })
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
    remainingGeohashesToProcess: string[],
    currentNeighborSearchLevel: number,
    donorSearchRepository: Repository<DonorSearchDTO>
  ): Promise<void> {
    const updatedRecord: Partial<DonorSearchDTO> = {
      requestPostId,
      seekerId,
      createdAt,
      currentNeighborSearchLevel,
      remainingGeohashesToProcess
    }
    await donorSearchRepository.update(updatedRecord)
  }

  async queryGeohash(
    city: string,
    requestedBloodGroup: string,
    geohash: string,
    geohashRepository: GeohashRepository<LocationDTO, Record<string, unknown>>,
    lastEvaluatedKey: Record<string, unknown> | undefined = undefined,
    foundDonors: LocationDTO[] = []
  ): Promise<LocationDTO[]> {
    const queryResult = await geohashRepository.queryGeohash(
      city,
      requestedBloodGroup,
      geohash,
      lastEvaluatedKey
    )
    const updatedDonors = [...foundDonors, ...(queryResult.items ?? [])]
    const nextLastEvaluatedKey = queryResult.lastEvaluatedKey

    return nextLastEvaluatedKey != null
      ? this.queryGeohash(
        city,
        requestedBloodGroup,
        geohash,
        geohashRepository,
        nextLastEvaluatedKey,
        updatedDonors
      )
      : updatedDonors
  }

  getNeighborGeohashes = (
    geohash: string,
    neighborLevel: number,
    currentGeohashes: string[] = []
  ): { updatedNeighborGeohashes: string[]; updatedNeighborLevel: number } => {
    const newGeohashes = getGeohashNthNeighbors(geohash, neighborLevel)
    const updatedGeohashes = [...currentGeohashes, ...newGeohashes]

    if (
      updatedGeohashes.length >= Number(process.env.MAX_GEOHASHES_PER_PROCESSING_BATCH) ||
      neighborLevel > Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL)
    ) {
      return { updatedNeighborGeohashes: updatedGeohashes, updatedNeighborLevel: neighborLevel }
    }

    return this.getNeighborGeohashes(geohash, neighborLevel + 1, updatedGeohashes)
  }
}
