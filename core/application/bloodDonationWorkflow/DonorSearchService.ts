import type { EligibleDonorInfo } from '../../../commons/dto/DonationDTO'
import {
  DonationStatus,
  DonorSearchStatus,
  AcceptDonationStatus,
  type DonorSearchDTO
} from '../../../commons/dto/DonationDTO'
import { haversineKm } from '../utils/h3'
import type { DonorSearchConfig } from './Types'
import {
  DynamoDBEventName,
  type DonationRequestInitiatorAttributes,
  type DonorSearchAttributes,
  type DonorSearchSchedulerAttributes
} from './Types'
import type { QueueModel } from '../models/queue/QueueModel'
import type { Logger } from '../models/logger/Logger'
import type DonorSearchRepository from '../models/policies/repositories/DonorSearchRepository'
import type { H3SearchService } from './H3SearchService'
import type { DonorInHexResult } from '../models/policies/repositories/H3SearchRepository'
import type { BloodDonationService } from './BloodDonationService'
import type { AcceptDonationService } from './AcceptDonationRequestService'
import type { NotificationService } from '../notificationWorkflow/NotificationService'
import { calculateDelayPeriod, calculateTotalDonorsToFind } from '../utils/calculateDonorsToNotify'
import type { SchedulerModel } from '../models/scheduler/SchedulerModel'
import { cellToLatLng } from 'h3-js'

export class DonorSearchService {
  constructor(
    protected readonly donorSearchRepository: DonorSearchRepository,
    protected readonly logger: Logger,
    protected readonly options: DonorSearchConfig
  ) { }

  async initiateDonorSearchRequest(
    donationRequestInitiatorAttributes: DonationRequestInitiatorAttributes,
    schedulerModel: SchedulerModel,
    donationStatus: DonationStatus,
    eventName: DynamoDBEventName
  ): Promise<void> {
    await this.doInitiateDonorSearchRequest(
      donationRequestInitiatorAttributes,
      schedulerModel,
      donationStatus,
      eventName
    )
  }

  private async doInitiateDonorSearchRequest(
    donationRequestInitiatorAttributes: DonationRequestInitiatorAttributes,
    schedulerModel: SchedulerModel,
    donationStatus: DonationStatus,
    eventName: DynamoDBEventName
  ): Promise<void> {
    const { seekerId, requestPostId, createdAt, centerHex } = donationRequestInitiatorAttributes

    const donorSearchAttributes: DonorSearchAttributes = {
      seekerId,
      requestPostId,
      createdAt,
      status: DonorSearchStatus.PENDING,
      notifiedEligibleDonors: {}
    }

    const schedulerAttributes: DonorSearchSchedulerAttributes = {
      seekerId,
      requestPostId,
      createdAt,
      currentLevel: 0,
      remainingCells: [centerHex],
      retryCount: 0
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
      await this.scheduleDonorSearchRequest(schedulerAttributes, schedulerModel)
    } else if (shouldRestartSearch) {
      this.logger.info('restarting donor search request')
      await this.updateDonorSearchRecord({
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING
      })
      await this.scheduleDonorSearchRequest(schedulerAttributes, schedulerModel)
    } else {
      this.logger.info('donor search record already exists; no restart triggered')
    }
  }

  async scheduleDonorSearchRequest(
    schedulerAttributes: DonorSearchSchedulerAttributes,
    schedulerModel: SchedulerModel
  ): Promise<void> {
    await schedulerModel.schedule(
      schedulerAttributes,
      this.options.donorSearchLambdaArn
    )
  }

  async searchDonors({
    seekerId,
    requestPostId,
    createdAt,
    remainingDonorsToFind,
    currentLevel,
    remainingCells,
    retryCount,
    bloodDonationService,
    acceptDonationService,
    notificationService,
    h3SearchService,
    queueModel,
    schedulerModel
  }: {
    seekerId: string;
    requestPostId: string;
    createdAt: string;
    targetedExecutionTime?: number;
    remainingDonorsToFind?: number;
    currentLevel: number;
    remainingCells: string[];
    retryCount: number;
    bloodDonationService: BloodDonationService;
    acceptDonationService: AcceptDonationService;
    notificationService: NotificationService;
    h3SearchService: H3SearchService;
    queueModel: QueueModel;
    schedulerModel: SchedulerModel;
  }): Promise<void> {
    const donationPost = await bloodDonationService.getDonationRequest(seekerId, requestPostId, createdAt)
    if (
      donationPost.status === DonationStatus.COMPLETED
      || donationPost.status === DonationStatus.CANCELLED
    ) {
      this.logger.info(`terminating process as donation status is ${donationPost.status}`)

      return
    }

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
      h3Res8: centerHex
    } = donationPost

    const remainingBagsNeeded
      = await acceptDonationService.getRemainingBagsNeeded(seekerId, requestPostId, bloodQuantity)
    if (remainingBagsNeeded === 0) {
      this.logger.info('terminating process as sufficient donors accepted')

      return
    }

    const existingNotifications
      = await notificationService.queryBloodDonationNotifications(requestPostId)
    const excluded = new Set<string>([
      ...existingNotifications.map((n) => n.userId),
      seekerId
    ])
    const rejectedDonorsCount = existingNotifications.filter(
      (n) => n.status === AcceptDonationStatus.IGNORED
    ).length

    const totalDonorsToFind
      = remainingDonorsToFind !== undefined && remainingDonorsToFind > 0
        ? remainingDonorsToFind + rejectedDonorsCount
        : calculateTotalDonorsToFind(remainingBagsNeeded, urgencyLevel)

    this.logger.info(`querying H3 cells to find ${totalDonorsToFind} eligible donors`)

    const { cells, finalLevel } = h3SearchService.buildRingBatch(
      centerHex,
      currentLevel,
      remainingCells,
      this.options.maxCellsPerExecution
    )

    const { eligibleDonors, processedCellCount } = await this.collectEligibleDonors({
      cells,
      excluded,
      countryCode,
      bloodGroup: requestedBloodGroup,
      donorsNeeded: totalDonorsToFind,
      centerHex,
      h3SearchService
    })

    const eligibleDonorsCount = Object.keys(eligibleDonors).length
    this.logger.info(`sending notification for donation request to ${eligibleDonorsCount} donors`)
    await notificationService.sendRequestNotification(
      donationPost,
      eligibleDonors,
      queueModel,
      this.options.notificationQueueUrl
    )

    if (eligibleDonorsCount > 0) {
      const mergedNotified = {
        ...(donorSearchRecord.notifiedEligibleDonors ?? {}),
        ...eligibleDonors
      }
      await this.updateDonorSearchRecord({
        seekerId,
        requestPostId,
        createdAt,
        notifiedEligibleDonors: mergedNotified
      })
    }

    const nextRemainingDonorsToFind = totalDonorsToFind - eligibleDonorsCount
    const leftoverCells = cells.slice(processedCellCount)
    const noDonorsFoundInBatch = leftoverCells.length === 0 && processedCellCount > 0
      && eligibleDonorsCount === 0

    if (nextRemainingDonorsToFind > 0 && leftoverCells.length > 0) {
      this.logger.info(
        {
          currentLevel: finalLevel,
          leftoverCellsCount: leftoverCells.length,
          remainingDonorsToFind: nextRemainingDonorsToFind,
          delaySeconds: this.options.searchIntervalSeconds,
          retryCount
        },
        `continuing donor search to find ${nextRemainingDonorsToFind} more donors`
      )

      await this.scheduleDonorSearchRequest(
        {
          seekerId,
          requestPostId,
          createdAt,
          currentLevel: finalLevel,
          remainingCells: leftoverCells,
          remainingDonorsToFind: nextRemainingDonorsToFind,
          retryCount
        },
        schedulerModel
      )

      return
    }

    if (retryCount >= this.options.maxRetries || !noDonorsFoundInBatch) {
      this.logger.info(`marking search COMPLETED — retryCount=${retryCount}, maxRetries=${this.options.maxRetries}`)
      await this.updateDonorSearchRecord({
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.COMPLETED
      })

      return
    }

    const retryDelaySeconds = calculateDelayPeriod(
      donationDateTime,
      this.options.maxRetries,
      this.options.retryDelaySeconds,
      this.options.acceptanceWindowSeconds
    )

    this.logger.info(
      { retryCount: retryCount + 1, retryDelaySeconds },
      `no donors found in batch; scheduling retry ${retryCount + 1}`
    )

    await this.scheduleDonorSearchRequest(
      {
        seekerId,
        requestPostId,
        createdAt,
        currentLevel: 0,
        remainingCells: [centerHex],
        retryCount: retryCount + 1,
        remainingDonorsToFind: 0,
        targetedExecutionTime: Date.now() + retryDelaySeconds * 1000
      },
      schedulerModel
    )
  }

  private async collectEligibleDonors({
    cells,
    excluded,
    countryCode,
    bloodGroup,
    donorsNeeded,
    centerHex,
    h3SearchService
  }: {
    cells: string[];
    excluded: Set<string>;
    countryCode: string;
    bloodGroup: string;
    donorsNeeded: number;
    centerHex: string;
    h3SearchService: H3SearchService;
  }): Promise<{ eligibleDonors: Record<string, EligibleDonorInfo>; processedCellCount: number }> {
    const seen = new Set<string>()
    const eligibleDonors: Record<string, EligibleDonorInfo> = {}
    let processedCellCount = 0

    const chunkSize = Math.max(1, this.options.parallelQueryConcurrency)

    for (let i = 0; i < cells.length; i += chunkSize) {
      if (processedCellCount >= this.options.maxCellsPerExecution) break
      if (Object.keys(eligibleDonors).length >= donorsNeeded) break

      const chunk = cells.slice(i, i + chunkSize)
      const queryResults = await Promise.all(
        chunk.map((cell) => h3SearchService.queryDonorsInHex(
          countryCode,
          bloodGroup,
          cell,
          donorsNeeded
        ))
      )

      for (const donors of queryResults) {
        processedCellCount += 1
        for (const donor of donors) {
          if (excluded.has(donor.userId)) continue
          if (seen.has(donor.userId)) continue
          seen.add(donor.userId)

          eligibleDonors[donor.userId] = {
            locationId: donor.locationId,
            distance: distanceForDonor(centerHex, donor)
          }

          if (Object.keys(eligibleDonors).length >= donorsNeeded) break
        }
        if (Object.keys(eligibleDonors).length >= donorsNeeded) break
      }
    }

    return { eligibleDonors, processedCellCount }
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
    return this.donorSearchRepository.getDonorSearchItem(seekerId, requestPostId, createdAt)
  }
}

function distanceForDonor(centerHex: string, donor: DonorInHexResult): number {
  const [seekerLat, seekerLng] = cellToLatLng(centerHex)

  return haversineKm(seekerLat, seekerLng, donor.latitude, donor.longitude)
}
