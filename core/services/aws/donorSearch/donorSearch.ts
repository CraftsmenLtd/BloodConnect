import type { SQSEvent } from 'aws-lambda'
import { DonorSearchService } from '../../../application/bloodDonationWorkflow/DonorSearchService'
import type { DonorSearchQueueAttributes } from '../../../application/bloodDonationWorkflow/Types'
import type {
  AcceptedDonationDTO,
  DonationDTO,
  DonorSearchDTO,
  EligibleDonorInfo
} from '../../../../commons/dto/DonationDTO';
import {
  AcceptDonationStatus,
  DonorSearchStatus
,
  DonationStatus} from '../../../../commons/dto/DonationDTO'
import type { LocationDTO } from '../../../../commons/dto/UserDTO'

import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import type {
  DonorSearchFields} from '../../../application/models/dbModels/DonorSearchModel';
import {
  DonorSearchModel
} from '../../../application/models/dbModels/DonorSearchModel'
import SQSOperations from '../commons/sqs/SQSOperations'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import {
  DonorSearchIntentionalError,
  DonorSearchOperationalError
} from '../../../application/bloodDonationWorkflow/DonorSearchOperationalError'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import AcceptedDonationDynamoDbOperations from '../commons/ddb/AcceptedDonationDynamoDbOperations'
import type {
  AcceptedDonationFields} from '../../../application/models/dbModels/AcceptDonationModel';
import {
  AcceptDonationRequestModel
} from '../../../application/models/dbModels/AcceptDonationModel'
import {
  calculateDelayPeriod,
  calculateRemainingBagsNeeded,
  calculateTotalDonorsToFind
} from '../../../application/utils/calculateDonorsToNotify'
import type {
  DonorInfo,
  GeohashDonorMap} from '../../../application/utils/GeohashCacheMapManager';
import {
  GeohashCacheManager,
  updateGroupedGeohashCache
} from '../../../application/utils/GeohashCacheMapManager'
import GeohashDynamoDbOperations from '../commons/ddb/GeohashDynamoDbOperations'
import type { LocationFields } from '../../../application/models/dbModels/LocationModel';
import LocationModel from '../../../application/models/dbModels/LocationModel'
import { getDistanceBetweenGeohashes } from '../../../application/utils/geohash'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import type { DonationNotificationAttributes } from '../../../application/notificationWorkflow/Types'
import { getBloodRequestMessage } from '../../../application/bloodDonationWorkflow/BloodDonationMessages'
import type {
  BloodDonationNotificationDTO} from '../../../../commons/dto/NotificationDTO';
import {
  NotificationType
} from '../../../../commons/dto/NotificationDTO'
import { GEO_PARTITION_PREFIX_LENGTH, MAX_QUEUE_VISIBILITY_TIMEOUT_SECONDS } from '../../../../commons/libs/constants/NoMagicNumbers'
import type {
  BloodDonationNotificationFields
} from '../../../application/models/dbModels/DonationNotificationModel';
import DonationNotificationModel from '../../../application/models/dbModels/DonationNotificationModel'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import type { DonationFields} from '../../../application/models/dbModels/BloodDonationModel';
import { BloodDonationModel } from '../../../application/models/dbModels/BloodDonationModel'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'

const bloodDonationService = new BloodDonationService()
const acceptDonationService = new AcceptDonationService()
const donorSearchService = new DonorSearchService()
const notificationService = new NotificationService()

const GEOHASH_CACHE = new GeohashCacheManager<string, GeohashDonorMap>(
  Number(process.env.MAX_GEOHASH_CACHE_ENTRIES_COUNT),
  Number(process.env.MAX_GEOHASH_CACHE_MB_SIZE),
  Number(process.env.MAX_GEOHASH_CACHE_TIMEOUT_MINUTES)
)

async function donorSearch(event: SQSEvent): Promise<void> {
  const record = event.Records[0]
  const donorSearchQueueAttributes: DonorSearchQueueAttributes = JSON.parse(record.body)

  const {
    seekerId,
    requestPostId,
    createdAt,
    targetedExecutionTime,
    remainingDonorsToFind,
    currentNeighborSearchLevel,
    remainingGeohashesToProcess,
    initiationCount,
    notifiedEligibleDonors
  } = donorSearchQueueAttributes

  const serviceLogger = createServiceLogger(donorSearchQueueAttributes.seekerId, {
    requestPostId: donorSearchQueueAttributes.requestPostId,
    createdAt: donorSearchQueueAttributes.createdAt
  })

  try {
    const donationPost = await bloodDonationService.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt,
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel()
      )
    )

    if (donationPost.status === DonationStatus.COMPLETED || donationPost.status === DonationStatus.CANCELLED) {
      serviceLogger.info(`terminating process as donation status is ${donationPost.status}`)
      return
    }

    serviceLogger.info(`checking targeted execution time${targetedExecutionTime !== undefined ? ` ${targetedExecutionTime}` : ''}`)
    await handleVisibilityTimeout(targetedExecutionTime, record.receiptHandle)

    const donorSearchRecord = await donorSearchService.getDonorSearchRecord(
      seekerId,
      requestPostId,
      createdAt,
      new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
        new DonorSearchModel()
      )
    )
    if (donorSearchRecord == null) {
      serviceLogger.info('terminating process as no search record found')
      return
    }

    const { bloodQuantity, requestedBloodGroup, urgencyLevel, donationDateTime, countryCode, geohash } =
      donorSearchRecord

    const isFirstInitiation = initiationCount === 1
    const remainingBagsNeeded =
      isFirstInitiation
        ? bloodQuantity
        : await getRemainingBagsNeeded(seekerId, requestPostId, bloodQuantity)

    if (remainingBagsNeeded === 0) {
      serviceLogger.info('terminating process as sufficient donors have accepted the request')
      return
    }

    const rejectedDonorsCount: number =
      isFirstInitiation ? 0 : await getRejectedDonorsCount(requestPostId)

    const totalDonorsToFind =
      remainingDonorsToFind !== undefined && remainingDonorsToFind > 0
        ? remainingDonorsToFind + rejectedDonorsCount
        : calculateTotalDonorsToFind(remainingBagsNeeded, rejectedDonorsCount, urgencyLevel)

    serviceLogger.info(`querying geohash to find ${totalDonorsToFind} eligible donors`)
    const { eligibleDonors, updatedNeighborSearchLevel, geohashesForNextIteration } =
      await queryEligibleDonors(
        seekerId,
        requestedBloodGroup,
        countryCode,
        geohash,
        totalDonorsToFind,
        currentNeighborSearchLevel,
        remainingGeohashesToProcess,
        notifiedEligibleDonors
      )

    serviceLogger.info(
      `sending notification for donation request to ${Object.keys(eligibleDonors).length} donors`
    )
    await sendRequestNotification(donorSearchRecord, eligibleDonors)

    const hasMaxGeohashLevelReached =
      updatedNeighborSearchLevel >= Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL) &&
      geohashesForNextIteration.length === 0

    const nextRemainingDonorsToFind = totalDonorsToFind - Object.keys(eligibleDonors).length

    const updatedNotifiedEligibleDonors = { ...notifiedEligibleDonors, ...eligibleDonors }

    if (!hasMaxGeohashLevelReached && nextRemainingDonorsToFind > 0) {
      const delayPeriod = calculateDelayPeriod(remainingBagsNeeded, donationDateTime, urgencyLevel)
      serviceLogger.info(
        {
          currentNeighborSearchLevel: updatedNeighborSearchLevel,
          remainingGeohashesToProcessCount: geohashesForNextIteration.length,
          remainingDonorsToFind: nextRemainingDonorsToFind,
          delayPeriod,
          initiationCount
        },
        `continuing donor search to find remaining ${nextRemainingDonorsToFind} donors`
      )

      await donorSearchService.enqueueDonorSearchRequest(
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
        new SQSOperations(),
        delayPeriod
      )
      return
    }

    const hasDonorSearchMaxInstantiatedRetryReached =
      donorSearchQueueAttributes.initiationCount >=
      Number(process.env.DONOR_SEARCH_MAX_INITIATING_RETRY_COUNT)

    if (!hasDonorSearchMaxInstantiatedRetryReached) {
      const initiatingDelayPeriod = calculateDelayPeriod(
        remainingBagsNeeded,
        donationDateTime,
        urgencyLevel,
        true
      )
      serviceLogger.info(
        {
          currentNeighborSearchLevel: updatedNeighborSearchLevel,
          remainingGeohashesToProcessCount: geohashesForNextIteration.length,
          initiationCount: initiationCount + 1,
          initiatingDelayPeriod
        },
        `initiating retry request ${initiationCount + 1}`
      )

      await donorSearchService.enqueueDonorSearchRequest(
        {
          seekerId,
          requestPostId,
          createdAt,
          notifiedEligibleDonors: updatedNotifiedEligibleDonors,
          currentNeighborSearchLevel: 0,
          remainingGeohashesToProcess: [
            geohash.slice(0, Number(process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH))
          ],
          initiationCount: initiationCount + 1,
          remainingDonorsToFind: 0,
          targetedExecutionTime: Math.floor(Date.now() / 1000) + initiatingDelayPeriod
        },
        new SQSOperations(),
        Number(process.env.DONOR_SEARCH_QUEUE_MIN_DELAY_SECONDS)
      )
    } else {
      serviceLogger.info(`updating donor search status to ${DonorSearchStatus.COMPLETED}`)
      await donorSearchService.updateDonorSearchRecord(
        {
          seekerId,
          requestPostId,
          createdAt,
          notifiedEligibleDonors: updatedNotifiedEligibleDonors,
          status: DonorSearchStatus.COMPLETED
        },
        new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
          new DonorSearchModel()
        )
      )
    }
  } catch (error) {
    serviceLogger.error(
      error instanceof DonorSearchIntentionalError || error instanceof DonorSearchOperationalError
        ? error.message
        : error
    )
    throw error
  }
}

export default donorSearch

async function sendRequestNotification(
  donorSearchAttributes: DonorSearchDTO,
  eligibleDonors: Record<string, EligibleDonorInfo>
): Promise<void> {
  for (const donorId in eligibleDonors) {
    const notificationAttributes: DonationNotificationAttributes = {
      userId: donorId,
      title: 'Blood Request',
      body: getBloodRequestMessage(
        donorSearchAttributes.urgencyLevel,
        donorSearchAttributes.requestedBloodGroup,
        donorSearchAttributes.shortDescription
      ),
      type: NotificationType.BLOOD_REQ_POST,
      status: AcceptDonationStatus.PENDING,
      payload: {
        seekerId: donorSearchAttributes.seekerId,
        requestPostId: donorSearchAttributes.requestPostId,
        createdAt: donorSearchAttributes.createdAt,
        locationId: eligibleDonors[donorId].locationId,
        distance: eligibleDonors[donorId].distance,
        seekerName: donorSearchAttributes.seekerName,
        patientName: donorSearchAttributes.patientName,
        requestedBloodGroup: donorSearchAttributes.requestedBloodGroup,
        bloodQuantity: donorSearchAttributes.bloodQuantity,
        urgencyLevel: donorSearchAttributes.urgencyLevel,
        location: donorSearchAttributes.location,
        contactNumber: donorSearchAttributes.contactNumber,
        transportationInfo: donorSearchAttributes.transportationInfo,
        shortDescription: donorSearchAttributes.shortDescription,
        donationDateTime: donorSearchAttributes.donationDateTime
      }
    }
    await notificationService.sendNotification(notificationAttributes, new SQSOperations())
  }
}

async function handleVisibilityTimeout(
  targetedExecutionTime: number | undefined,
  receiptHandle: string
): Promise<void> {
  const currentUnixTime = Math.floor(Date.now() / 1000)
  if (targetedExecutionTime !== undefined && targetedExecutionTime > currentUnixTime) {
    const visibilityTimeout = Math.min(
      targetedExecutionTime - currentUnixTime,
      MAX_QUEUE_VISIBILITY_TIMEOUT_SECONDS
    )
    await donorSearchService.updateVisibilityTimeout(
      receiptHandle,
      visibilityTimeout,
      new SQSOperations()
    )
    throw new DonorSearchIntentionalError(`updated visibility timeout to ${visibilityTimeout}`)
  }
}

async function getRemainingBagsNeeded(
  seekerId: string,
  requestPostId: string,
  bloodQuantity: number
): Promise<number> {
  const acceptedDonors = await acceptDonationService.getAcceptedDonorList(
    seekerId,
    requestPostId,
    new AcceptedDonationDynamoDbOperations<
    AcceptedDonationDTO,
    AcceptedDonationFields,
    AcceptDonationRequestModel
    >(new AcceptDonationRequestModel())
  )
  return calculateRemainingBagsNeeded(bloodQuantity, acceptedDonors.length)
}

async function queryEligibleDonors(
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
    donorSearchService.getNeighborGeohashes(
      geohash.slice(0, Number(process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH)),
      currentNeighborSearchLevel,
      remainingGeohashesToProcess
    )

  const { updatedEligibleDonors, processedGeohashCount } = await getNewDonorsInNeighborGeohash(
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

async function getNewDonorsInNeighborGeohash(
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
    processedGeohashCount >= Number(process.env.MAX_GEOHASHES_PER_EXECUTION) ||
    Object.keys(eligibleDonors).length >= totalDonorsToFind
  ) {
    return { updatedEligibleDonors: eligibleDonors, processedGeohashCount }
  }

  const geohashToProcess = geohashesToProcess[0]
  const donors = await getDonorsFromCache(geohashToProcess, countryCode, requestedBloodGroup)

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

  return getNewDonorsInNeighborGeohash(
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

async function getDonorsFromCache(
  geohashToProcess: string,
  countryCode: string,
  requestedBloodGroup: string
): Promise<DonorInfo[]> {
  const geohashCachePrefix = geohashToProcess.slice(
    0,
    Number(process.env.CACHE_GEOHASH_PREFIX_LENGTH)
  )
  const geoPartitionPrefix = geohashToProcess.slice(0, GEO_PARTITION_PREFIX_LENGTH)

  const cacheKey = `${countryCode}-${geoPartitionPrefix}-${requestedBloodGroup}-${geohashCachePrefix}`
  const cachedGroupedGeohash = GEOHASH_CACHE.get(cacheKey) as GeohashDonorMap

  if (cachedGroupedGeohash === undefined) {
    const queriedDonors = await donorSearchService.queryGeohash(
      countryCode,
      requestedBloodGroup,
      geohashCachePrefix,
      new GeohashDynamoDbOperations<LocationDTO, LocationFields, LocationModel>(new LocationModel())
    )
    updateGroupedGeohashCache(GEOHASH_CACHE, queriedDonors, cacheKey)
  }

  const cachedDonorMap = GEOHASH_CACHE.get(cacheKey) as GeohashDonorMap
  return cachedDonorMap[geohashToProcess] ?? []
}

async function getRejectedDonorsCount(requestPostId: string): Promise<number> {
  const rejectedDonors = await notificationService.getIgnoredDonorList(
    requestPostId,
    new NotificationDynamoDbOperations<
    BloodDonationNotificationDTO,
    BloodDonationNotificationFields,
    DonationNotificationModel
    >(new DonationNotificationModel())
  )
  return rejectedDonors.length
}
