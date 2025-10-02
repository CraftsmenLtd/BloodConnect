import type { EligibleDonorInfo } from '../../../commons/dto/DonationDTO'
import {
  DonationStatus,
  DonorSearchStatus,
  type DonorSearchDTO
} from '../../../commons/dto/DonationDTO'
import { getDistanceBetweenGeohashes } from '../utils/geohash'
import type { DonorSearchConfig } from './Types'
import {
  DynamoDBEventName,
  type DonationRequestInitiatorAttributes,
  type DonorSearchAttributes,
  type DonorSearchQueueAttributes
} from './Types'
import type { QueueModel } from '../models/queue/QueueModel'
import {
  GEO_PARTITION_PREFIX_LENGTH,
  MAX_QUEUE_VISIBILITY_TIMEOUT_SECONDS
} from '../../../commons/libs/constants/NoMagicNumbers'
import type { Logger } from '../models/logger/Logger'
import type DonorSearchRepository from '../models/policies/repositories/DonorSearchRepository'
import { DonorSearchIntentionalError } from './DonorSearchOperationalError'
import type {
  DonorInfo,
  GeohashCacheManager,
  GeohashDonorMap
} from '../utils/GeohashCacheMapManager'
import { updateGroupedGeohashCache } from '../utils/GeohashCacheMapManager'
import type { GeohashService } from './GeohashService'
import type { BloodDonationService } from './BloodDonationService'
import type { AcceptDonationService } from './AcceptDonationRequestService'
import type { NotificationService } from '../notificationWorkflow/NotificationService'
import { calculateDelayPeriod, calculateTotalDonorsToFind } from '../utils/calculateDonorsToNotify'
import { SchedulerModel } from '../models/scheduler/SchedulerModel'

export class DonorSearchService {
  constructor(
    protected readonly donorSearchRepository: DonorSearchRepository,
    protected readonly logger: Logger,
    protected readonly options: DonorSearchConfig
  ) {}

  async initiateDonorSearchRequest(
    donationRequestInitiatorAttributes: DonationRequestInitiatorAttributes,
    schedulerModel: SchedulerModel,
    donationStatus: DonationStatus,
    eventName: DynamoDBEventName
  ): Promise<void> {
    const { seekerId, requestPostId, createdAt } = donationRequestInitiatorAttributes

    const donorSearchAttributes: DonorSearchAttributes = {
      ...donationRequestInitiatorAttributes,
      status: DonorSearchStatus.PENDING,
      notifiedEligibleDonors: {}
    }

    const donorSearchQueueAttributes: DonorSearchQueueAttributes = {
      seekerId,
      requestPostId,
      createdAt,
      currentNeighborSearchLevel: 0,
      remainingGeohashesToProcess: [
        donationRequestInitiatorAttributes.geohash.slice(
          0,
          this.options.neighborSearchGeohashPrefixLength
        )
      ],
      notifiedEligibleDonors: {},
      initiationCount: 1
    }

    const donorSearchRecord = await this.getDonorSearch(seekerId, requestPostId, createdAt)

    const shouldRestartSearch
      = donorSearchRecord?.status === DonorSearchStatus.COMPLETED
      && eventName === DynamoDBEventName.MODIFY
      && donationStatus === DonationStatus.PENDING

    if (donorSearchRecord === null) {
      this.logger.info('inserting donor search record')
      await this.createDonorSearchRecord(donorSearchAttributes)

      this.logger.info('starting donor search request')
      await this.scheduleDonorSearchRequest(donorSearchQueueAttributes, schedulerModel)
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
      this.logger.info('restarting donor search request')
      await this.scheduleDonorSearchRequest(donorSearchQueueAttributes, schedulerModel)
    }
  }

  async enqueueDonorSearchRequest(
    donorSearchQueueAttributes: DonorSearchQueueAttributes,
    queueModel: QueueModel,
    delayPeriod?: number
  ): Promise<void> {
    await queueModel.queue(
      donorSearchQueueAttributes,
      this.options.donorSearchQueueUrl,
      delayPeriod
    )
  }
  
  async scheduleDonorSearchRequest(
    donorSearchQueueAttributes: DonorSearchQueueAttributes,
    schedulerModel: SchedulerModel,
    delayPeriod?: number
  ): Promise<void> {
    await schedulerModel.schedule(
      donorSearchQueueAttributes,
      this.options.donorSearchLambdaArn,
      delayPeriod
    )
  }

  async searchDonors({
    seekerId,
    requestPostId,
    createdAt,
    targetedExecutionTime,
    remainingDonorsToFind,
    currentNeighborSearchLevel,
    remainingGeohashesToProcess,
    initiationCount,
    notifiedEligibleDonors,
    bloodDonationService,
    acceptDonationService,
    notificationService,
    geohashService,
    queueModel,
    schedulerModel,
    geohashCache
  }: {
    seekerId: string;
    requestPostId: string;
    createdAt: string;
    targetedExecutionTime?: number;
    remainingDonorsToFind?: number;
    currentNeighborSearchLevel: number;
    remainingGeohashesToProcess: string[];
    initiationCount: number;
    notifiedEligibleDonors: Record<string, EligibleDonorInfo>;
    bloodDonationService: BloodDonationService;
    acceptDonationService: AcceptDonationService;
    notificationService: NotificationService;
    geohashService: GeohashService;
    queueModel: QueueModel;
    schedulerModel: SchedulerModel;
    geohashCache: GeohashCacheManager<string, GeohashDonorMap>;
  }): Promise<void> {
    const donationPost = await bloodDonationService.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )

    if (
      donationPost.status === DonationStatus.COMPLETED
      || donationPost.status === DonationStatus.CANCELLED
    ) {
      this.logger.info(`terminating process as donation status is ${donationPost.status}`)

      return
    }

    this.logger.info(
      `checking targeted execution time${
        targetedExecutionTime !== undefined ? ` ${targetedExecutionTime}` : ''
      }`
    )
    const donorSearchRecord = await this.getDonorSearch(seekerId, requestPostId, createdAt)
    if (donorSearchRecord === null) {
      this.logger.info('terminating process as no search record found')

      return
    }

    const {
      bloodQuantity,
      requestedBloodGroup,
      urgencyLevel,
      donationDateTime,
      countryCode,
      geohash
    } = donationPost

    const isFirstInitiation = initiationCount === 1
    const remainingBagsNeeded = isFirstInitiation
      ? bloodQuantity
      : await acceptDonationService.getRemainingBagsNeeded(seekerId, requestPostId, bloodQuantity)

    if (remainingBagsNeeded === 0) {
      this.logger.info('terminating process as sufficient donors have accepted the request')

      return
    }

    const rejectedDonorsCount: number = isFirstInitiation
      ? 0
      : await notificationService.getRejectedDonorsCount(requestPostId)

    const totalDonorsToFind
      = remainingDonorsToFind !== undefined && remainingDonorsToFind > 0
        ? remainingDonorsToFind + rejectedDonorsCount
        : calculateTotalDonorsToFind(remainingBagsNeeded, urgencyLevel)

    this.logger.info(`querying geohash to find ${totalDonorsToFind} eligible donors`)
    const { eligibleDonors, updatedNeighborSearchLevel, geohashesForNextIteration }
      = await this.queryEligibleDonors(
        geohashService,
        geohashCache,
        seekerId,
        requestedBloodGroup,
        countryCode,
        geohash,
        totalDonorsToFind,
        currentNeighborSearchLevel,
        remainingGeohashesToProcess,
        notifiedEligibleDonors
      )

    const eligibleDonorsCount = Object.keys(eligibleDonors).length

    this.logger.info(`sending notification for donation request to ${eligibleDonorsCount} donors`)
    await notificationService.sendRequestNotification(
      donationPost,
      eligibleDonors,
      queueModel,
      this.options.notificationQueueUrl
    )

    const hasMaxGeohashLevelReached
      = updatedNeighborSearchLevel >= this.options.maxGeohashNeighborSearchLevel
      && geohashesForNextIteration.length === 0

    const nextRemainingDonorsToFind = totalDonorsToFind - eligibleDonorsCount

    const updatedNotifiedEligibleDonors = { ...notifiedEligibleDonors, ...eligibleDonors }

    if (!hasMaxGeohashLevelReached && nextRemainingDonorsToFind > 0) {
      this.logger.info(
        {
          currentNeighborSearchLevel: updatedNeighborSearchLevel,
          remainingGeohashesToProcessCount: geohashesForNextIteration.length,
          remainingDonorsToFind: nextRemainingDonorsToFind,
          delayPeriod: this.options.donorSearchDelayBetweenExecution,
          initiationCount
        },
        `continuing donor search to find remaining ${nextRemainingDonorsToFind} donors`
      )

      await this.scheduleDonorSearchRequest(
        {
          seekerId,
          requestPostId,
          createdAt,
          notifiedEligibleDonors: updatedNotifiedEligibleDonors,
          currentNeighborSearchLevel: updatedNeighborSearchLevel,
          remainingGeohashesToProcess: geohashesForNextIteration,
          remainingDonorsToFind: nextRemainingDonorsToFind,
          initiationCount
        },
        schedulerModel,
        this.options.donorSearchDelayBetweenExecution
      )

      return
    }

    const hasDonorSearchMaxInstantiatedRetryReached
      = initiationCount >= this.options.donorSearchMaxInitiatingRetryCount

    if (hasDonorSearchMaxInstantiatedRetryReached) {
      this.logger.info(
        `updating donor search status to ${DonorSearchStatus.COMPLETED} as max retry reached`
      )
      await this.updateDonorSearchRecord({
        seekerId,
        requestPostId,
        createdAt,
        notifiedEligibleDonors: updatedNotifiedEligibleDonors,
        status: DonorSearchStatus.COMPLETED
      })

      return
    }

    const initiatingDelayPeriod = calculateDelayPeriod(
      donationDateTime,
      this.options.maxGeohashPerProcessingBatch,
      this.options.maxGeohashesPerExecution,
      this.options.donorSearchMaxInitiatingRetryCount,
      this.options.donorSearchDelayBetweenExecution
    )
    this.logger.info(
      {
        currentNeighborSearchLevel: updatedNeighborSearchLevel,
        remainingGeohashesToProcessCount: geohashesForNextIteration.length,
        initiationCount: initiationCount + 1,
        initiatingDelayPeriod
      },
      `initiating retry request ${initiationCount + 1}`
    )

    await this.scheduleDonorSearchRequest(
      {
        seekerId,
        requestPostId,
        createdAt,
        notifiedEligibleDonors: updatedNotifiedEligibleDonors,
        currentNeighborSearchLevel: 0,
        remainingGeohashesToProcess: [
          geohash.slice(0, this.options.neighborSearchGeohashPrefixLength)
        ],
        initiationCount: initiationCount + 1,
        remainingDonorsToFind: 0,
        targetedExecutionTime: Math.floor(Date.now() / 1000) + initiatingDelayPeriod
      },
      schedulerModel,
      this.options.donorSearchDelayBetweenExecution
    )
  }

  async handleVisibilityTimeout(
    queueModel: QueueModel,
    targetedExecutionTime: number | undefined,
    receiptHandle: string
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
    requestPostId: string,
    createdAt: string
  ): Promise<DonorSearchDTO | null> {
    return this.donorSearchRepository.getDonorSearchItem(
      seekerId,
      requestPostId,
      createdAt
    )
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
    const { updatedGeohashesToProcess, updatedNeighborSearchLevel }
      = geohashService.getNeighborGeohashes(
        geohash.slice(0, this.options.neighborSearchGeohashPrefixLength),
        currentNeighborSearchLevel,
        remainingGeohashesToProcess
      )

    const { updatedEligibleDonors, processedGeohashCount }
      = await this.getNewDonorsInNeighborGeohash(
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
      geohashesToProcess.length === 0
      || processedGeohashCount >= this.options.maxGeohashesPerExecution
      || Object.keys(eligibleDonors).length >= totalDonorsToFind
    ) {
      return { updatedEligibleDonors: eligibleDonors, processedGeohashCount }
    }

    const geohashToProcess = geohashesToProcess[0]
    const donors = await this.getDonorsFromCache(
      geohashService,
      geohashCache,
      geohashToProcess,
      countryCode,
      requestedBloodGroup
    )

    const updatedEligibleDonors = donors.reduce<Record<string, EligibleDonorInfo>>(
      (donorAccumulator, donor) => {
        const donorDistance = getDistanceBetweenGeohashes(seekerGeohash, geohashToProcess)

        const isDonorTheSeeker = donor.userId === seekerId
        const isDonorCloserOrNew
          = donorAccumulator[donor.userId] === undefined
          || donorAccumulator[donor.userId].distance > donorDistance
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
    const geohashCachePrefix = geohashToProcess.slice(0, this.options.cacheGeohashPrefixLength)
    const geoPartitionPrefix = geohashToProcess.slice(0, GEO_PARTITION_PREFIX_LENGTH)

    const cacheKey = `${countryCode}-${geoPartitionPrefix}-${requestedBloodGroup}-${geohashCachePrefix}`
    const cachedGroupedGeohash = geohashCache.get(cacheKey) as GeohashDonorMap

    if (cachedGroupedGeohash === undefined) {
      const queriedDonors = await geohashService.queryGeohash(
        countryCode,
        requestedBloodGroup,
        geohashCachePrefix
      )
      updateGroupedGeohashCache(geohashCache, queriedDonors, cacheKey, this.options.neighborSearchGeohashPrefixLength)
    }

    const cachedDonorMap = geohashCache.get(cacheKey) as GeohashDonorMap

    return cachedDonorMap[geohashToProcess] ?? []
  }
}
