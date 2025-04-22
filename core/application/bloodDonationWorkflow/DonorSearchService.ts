import type { EligibleDonorInfo } from '../../../commons/dto/DonationDTO';
import { DonationStatus, DonorSearchStatus, type DonorSearchDTO } from '../../../commons/dto/DonationDTO'
import { getDistanceBetweenGeohashes } from '../utils/geohash'
import type { DonorSearchConfig } from './Types';
import {
  DynamoDBEventName,
  type DonationRequestInitiatorAttributes,
  type DonorSearchAttributes,
  type DonorSearchQueueAttributes
} from './Types'
import { DONOR_SEARCH_PK_PREFIX } from '../../services/aws/commons/ddbModels/DonorSearchModel'
import type { QueueModel } from '../models/queue/QueueModel'
import { GEO_PARTITION_PREFIX_LENGTH, MAX_QUEUE_VISIBILITY_TIMEOUT_SECONDS } from '../../../commons/libs/constants/NoMagicNumbers'
import type { UserService } from '../userWorkflow/UserService'
import type { Logger } from '../models/logger/Logger'
import type DonorSearchRepository from '../models/policies/repositories/DonorSearchRepository'
import { DonorSearchIntentionalError } from './DonorSearchOperationalError'
import type { DonorInfo, GeohashCacheManager, GeohashDonorMap } from '../utils/GeohashCacheMapManager';
import { updateGroupedGeohashCache } from '../utils/GeohashCacheMapManager'
import type { GeohashService } from './GeohashService'

export class DonorSearchService {
  constructor(
    protected readonly donorSearchRepository: DonorSearchRepository,
    protected readonly logger: Logger,
    protected readonly options: DonorSearchConfig
  ) { }

  async initiateDonorSearchRequest(
    donationRequestInitiatorAttributes: DonationRequestInitiatorAttributes,
    userService: UserService,
    queueModel: QueueModel
  ): Promise<void> {
    const { seekerId, requestPostId, createdAt } = donationRequestInitiatorAttributes
    const userProfile = await userService.getUser(seekerId)

    const donorSearchAttributes: DonorSearchAttributes = {
      ...donationRequestInitiatorAttributes,
      seekerName: userProfile.name,
      status: DonorSearchStatus.PENDING,
      notifiedEligibleDonors: {}
    }

    const donorSearchQueueAttributes: DonorSearchQueueAttributes = {
      seekerId,
      requestPostId,
      createdAt,
      currentNeighborSearchLevel: 0,
      remainingGeohashesToProcess: [
        donationRequestInitiatorAttributes.geohash.slice(0, this.options.neighborSearchGeohashPrefixLength)
      ],
      notifiedEligibleDonors: {},
      initiationCount: 1
    }

    const donorSearchRecord = await this.getDonorSearchRecord(seekerId, requestPostId, createdAt)

    const shouldRestartSearch =
      donationRequestInitiatorAttributes.eventName === DynamoDBEventName.MODIFY &&
      donationRequestInitiatorAttributes.status === DonationStatus.PENDING &&
      donorSearchRecord !== null &&
      donorSearchRecord.status === DonorSearchStatus.COMPLETED

    if (donorSearchRecord === null) {
      this.logger.info('inserting donor search record')
      await this.createDonorSearchRecord(donorSearchAttributes)
    } else {
      this.logger.info('updating donor search record because the donation request has been updated')
      await this.updateDonorSearchRecord({
        ...donorSearchAttributes,
        status: shouldRestartSearch ? DonorSearchStatus.PENDING : donorSearchRecord.status,
        notifiedEligibleDonors: donorSearchRecord.notifiedEligibleDonors
      })
    }

    if (shouldRestartSearch) {
      donorSearchQueueAttributes.notifiedEligibleDonors = donorSearchRecord.notifiedEligibleDonors
    }

    this.logger.info('starting donor search request')
    await this.enqueueDonorSearchRequest(donorSearchQueueAttributes, queueModel)
  }

  async enqueueDonorSearchRequest(
    donorSearchQueueAttributes: DonorSearchQueueAttributes,
    queueModel: QueueModel,
    delayPeriod?: number
  ): Promise<void> {
    await queueModel.queue(donorSearchQueueAttributes, this.options.donorSearchQueueUrl, delayPeriod)
  }


  async handleVisibilityTimeout(
    queueModel: QueueModel,
    targetedExecutionTime: number | undefined,
    receiptHandle: string,
  ): Promise<void> {
    const currentUnixTime = Math.floor(Date.now() / 1000)
    if (targetedExecutionTime !== undefined && targetedExecutionTime > currentUnixTime) {
      const visibilityTimeout = Math.min(
        targetedExecutionTime - currentUnixTime,
        MAX_QUEUE_VISIBILITY_TIMEOUT_SECONDS
      )
      await queueModel.updateVisibilityTimeout(
        receiptHandle,
        this.options.donorSearchQueueUrl,
        visibilityTimeout
      )
      throw new DonorSearchIntentionalError(`updated visibility timeout to ${visibilityTimeout}`)
    }
  }

  async getDonorSearchRecord(
    seekerId: string,
    requestPostId: string,
    createdAt: string
  ): Promise<DonorSearchDTO | null> {
    return this.donorSearchRepository.getItem(
      `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
  }

  async createDonorSearchRecord(donorSearchAttributes: DonorSearchAttributes): Promise<void> {
    await this.donorSearchRepository.create(donorSearchAttributes)
  }

  async updateDonorSearchRecord(
    donorSearchAttributes: Partial<DonorSearchAttributes>
  ): Promise<void> {
    await this.donorSearchRepository.update(donorSearchAttributes)
  }

  async getDonorSearch(
    seekerId: string,
    createdAt: string,
    requestPostId: string
  ): Promise<DonorSearchDTO> {
    const donorSearchRecord = await this.donorSearchRepository.getDonorSearchItem(
      seekerId,
      requestPostId,
      createdAt
    )
    if (donorSearchRecord === null) {
      throw new Error('Donor search record not found.')
    }
    return donorSearchRecord
  }

  async queryEligibleDonors(
    geohashService: GeohashService,
    geohashCache: GeohashCacheManager<string, GeohashDonorMap>,
    seekerId: string,
    requestedBloodGroup: string,
    countryCode: string,
    geohash: string,
    totalDonorsToFind: number,
    currentNeighborSearchLevel: number,
    remainingGeohashesToProcess: string[],
    notifiedEligibleDonors: Record<string, EligibleDonorInfo>
  ): Promise<{
    eligibleDonors: Record<string, EligibleDonorInfo>;
    updatedNeighborSearchLevel: number;
    geohashesForNextIteration: string[];
  }> {
    const { updatedGeohashesToProcess, updatedNeighborSearchLevel } =
      geohashService.getNeighborGeohashes(
        geohash.slice(0, this.options.neighborSearchGeohashPrefixLength),
        currentNeighborSearchLevel,
        remainingGeohashesToProcess
      )

    const { updatedEligibleDonors, processedGeohashCount } = await this.getNewDonorsInNeighborGeohash(
      geohashService,
      geohashCache,
      seekerId,
      requestedBloodGroup,
      countryCode,
      geohash,
      updatedGeohashesToProcess,
      totalDonorsToFind,
      notifiedEligibleDonors
    )

    return {
      eligibleDonors: updatedEligibleDonors,
      updatedNeighborSearchLevel,
      geohashesForNextIteration: updatedGeohashesToProcess.slice(processedGeohashCount)
    }
  }

  async getNewDonorsInNeighborGeohash(
    geohashService: GeohashService,
    geohashCache: GeohashCacheManager<string, GeohashDonorMap>,
    seekerId: string,
    requestedBloodGroup: string,
    countryCode: string,
    seekerGeohash: string,
    geohashesToProcess: string[],
    totalDonorsToFind: number,
    notifiedEligibleDonors: Record<string, EligibleDonorInfo>,
    processedGeohashCount: number = 0,
    eligibleDonors: Record<string, EligibleDonorInfo> = {}
  ): Promise<{
    updatedEligibleDonors: Record<string, EligibleDonorInfo>;
    processedGeohashCount: number;
  }> {
    if (
      geohashesToProcess.length === 0 ||
      processedGeohashCount >= this.options.maxGeohashesPerExecution ||
      Object.keys(eligibleDonors).length >= totalDonorsToFind
    ) {
      return { updatedEligibleDonors: eligibleDonors, processedGeohashCount }
    }

    const geohashToProcess = geohashesToProcess[0]
    const donors = await this.getDonorsFromCache(geohashService, geohashCache, geohashToProcess, countryCode, requestedBloodGroup)

    const updatedEligibleDonors = donors.reduce<Record<string, EligibleDonorInfo>>(
      (donorAccumulator, donor) => {
        const donorDistance = getDistanceBetweenGeohashes(seekerGeohash, geohashToProcess)

        const isDonorTheSeeker = donor.userId === seekerId
        const isDonorCloserOrNew =
          donorAccumulator[donor.userId] === undefined ||
          donorAccumulator[donor.userId].distance > donorDistance
        const isDonorAlreadyNotified = notifiedEligibleDonors[donor.userId] !== undefined

        if (!isDonorTheSeeker && isDonorCloserOrNew && !isDonorAlreadyNotified) {
          donorAccumulator[donor.userId] = {
            locationId: donor.locationId,
            distance: donorDistance
          }
        }
        return donorAccumulator
      },
      { ...eligibleDonors }
    )

    return this.getNewDonorsInNeighborGeohash(
      geohashService,
      geohashCache,
      seekerId,
      requestedBloodGroup,
      countryCode,
      seekerGeohash,
      geohashesToProcess.slice(1),
      totalDonorsToFind,
      notifiedEligibleDonors,
      processedGeohashCount + 1,
      updatedEligibleDonors
    )
  }

  async getDonorsFromCache(
    geohashService: GeohashService,
    geohashCache: GeohashCacheManager<string, GeohashDonorMap>,
    geohashToProcess: string,
    countryCode: string,
    requestedBloodGroup: string
  ): Promise<DonorInfo[]> {
    const geohashCachePrefix = geohashToProcess.slice(
      0,
      this.options.cacheGeohashPrefixLength
    )
    const geoPartitionPrefix = geohashToProcess.slice(0, GEO_PARTITION_PREFIX_LENGTH)

    const cacheKey = `${countryCode}-${geoPartitionPrefix}-${requestedBloodGroup}-${geohashCachePrefix}`
    const cachedGroupedGeohash = geohashCache.get(cacheKey) as GeohashDonorMap

    if (cachedGroupedGeohash === undefined) {
      const queriedDonors = await geohashService.queryGeohash(
        countryCode,
        requestedBloodGroup,
        geohashCachePrefix
      )
      updateGroupedGeohashCache(geohashCache, queriedDonors, cacheKey)
    }

    const cachedDonorMap = geohashCache.get(cacheKey) as GeohashDonorMap
    return cachedDonorMap[geohashToProcess] ?? []
  }
}
