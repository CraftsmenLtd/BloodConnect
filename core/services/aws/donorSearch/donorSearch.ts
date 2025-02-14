import { SQSEvent } from 'aws-lambda'
import { DonorSearchService } from '../../../application/bloodDonationWorkflow/DonorSearchService'
import { DonorSearchQueueAttributes } from '../../../application/bloodDonationWorkflow/Types'
import {
  AcceptDonationStatus,
  AcceptedDonationDTO,
  DonorSearchDTO,
  DonorSearchStatus,
  EligibleDonorInfo
} from '../../../../commons/dto/DonationDTO'
import { LocationDTO } from '../../../../commons/dto/UserDTO'

import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import {
  DonorSearchFields,
  DonorSearchModel
} from '../../../application/models/dbModels/DonorSearchModel'
import SQSOperations from '../commons/sqs/SQSOperations'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import { Logger } from 'core/application/models/logger/Logger'
import {
  DonorSearchIntentionalError,
  DonorSearchOperationalError
} from '../../../application/bloodDonationWorkflow/DonorSearchOperationalError'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import AcceptedDonationDynamoDbOperations from '../commons/ddb/AcceptedDonationDynamoDbOperations'
import {
  AcceptedDonationFields,
  AcceptDonationRequestModel
} from '../../../application/models/dbModels/AcceptDonationModel'
import {
  calculateDelayPeriod,
  calculateRemainingBagsNeeded,
  calculateTotalDonorsToNotify
} from 'core/application/utils/calculateDonorsToNotify'
import {
  DonorInfo,
  GeohashCacheManager,
  GeohashDonorMap,
  updateGroupedGeohashCache
} from 'core/application/utils/GeohashCacheMapManager'
import GeohashDynamoDbOperations from '../commons/ddb/GeohashDynamoDbOperations'
import LocationModel, { LocationFields } from 'core/application/models/dbModels/LocationModel'
import { getDistanceBetweenGeohashes } from 'core/application/utils/geohash'
import { NotificationService } from 'core/application/notificationWorkflow/NotificationService'
import { DonationNotificationAttributes } from 'core/application/notificationWorkflow/Types'
import { getBloodRequestMessage } from 'core/application/bloodDonationWorkflow/BloodDonationMessages'
import { NotificationType } from 'commons/dto/NotificationDTO'

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
    potentialDonorsLeftToNotify,
    currentNeighborSearchLevel,
    remainingGeohashesToProcess,
    retryCount,
    reinstatedRetryCount
  } = donorSearchQueueAttributes

  const serviceLogger = createServiceLogger(donorSearchQueueAttributes.seekerId, {
    requestPostId: donorSearchQueueAttributes.requestPostId,
    createdAt: donorSearchQueueAttributes.createdAt
  })

  try {
    serviceLogger.info({
      seekerId,
      requestPostId,
      createdAt
    }, 'Starting donor search process')

    const donorSearchRecord = await donorSearchService.getDonorSearchRecord(
      seekerId,
      requestPostId,
      createdAt,
      new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
        new DonorSearchModel()
      )
    )
    if (donorSearchRecord == null) {
      serviceLogger.info(
        { seekerId, requestPostId },
        'No donor search record found, terminating process'
      )
      return
    }

    const { bloodQuantity, requestedBloodGroup, urgencyLevel, donationDateTime, city, geohash } =
      donorSearchRecord

    const notifiedEligibleDonors =
      Object.keys(donorSearchQueueAttributes.notifiedEligibleDonors).length > 0
        ? donorSearchQueueAttributes.notifiedEligibleDonors
        : donorSearchRecord.notifiedEligibleDonors

    serviceLogger.info('Checking targeted execution time')
    await CheckTargetedExecutionTime(targetedExecutionTime, record.receiptHandle, serviceLogger)

    const remainingBagsNeeded = await getRemainingBagsNeeded(seekerId, requestPostId, bloodQuantity)

    if (remainingBagsNeeded <= 0) {
      serviceLogger.info(
        { seekerId, requestPostId },
        'Sufficient donors have accepted the request, terminating process'
      )
      return
    }

    const totalDonorsToNotify =
      potentialDonorsLeftToNotify !== undefined && potentialDonorsLeftToNotify > 0
        ? potentialDonorsLeftToNotify
        : calculateTotalDonorsToNotify(remainingBagsNeeded, urgencyLevel)

    const { eligibleDonors, updatedNeighborSearchLevel, geohashesForNextIteration } =
      await queryEligibleDonors(
        seekerId,
        requestedBloodGroup,
        city,
        geohash,
        totalDonorsToNotify,
        currentNeighborSearchLevel,
        remainingGeohashesToProcess,
        notifiedEligibleDonors
      )

    await sendRequestNotification(donorSearchRecord, eligibleDonors)

    const hasMaxGeohashLevelReached =
      updatedNeighborSearchLevel >= Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL) &&
      geohashesForNextIteration.length === 0

    const haveTargetDonorsNotified = Object.keys(eligibleDonors).length >= totalDonorsToNotify

    const newNotifiedEligibleDonors = { ...notifiedEligibleDonors, ...eligibleDonors }

    if (!hasMaxGeohashLevelReached && !haveTargetDonorsNotified) {
      serviceLogger.info(
        {
          retryCount,
          reinstatedRetryCount,
          remainingDonorsToNotify: totalDonorsToNotify - Object.keys(eligibleDonors).length
        },
        'Continuing donor search process'
      )
      const newDonorSearchQueueAttributes = {
        seekerId,
        requestPostId,
        createdAt,
        notifiedEligibleDonors: newNotifiedEligibleDonors,
        currentNeighborSearchLevel: updatedNeighborSearchLevel,
        remainingGeohashesToProcess: geohashesForNextIteration,
        potentialDonorsLeftToNotify: totalDonorsToNotify - Object.keys(eligibleDonors).length,
        retryCount,
        reinstatedRetryCount
      }
      await donorSearchService.enqueueDonorSearchRequest(
        newDonorSearchQueueAttributes,
        new SQSOperations(),
        Number(process.env.DONOR_SEARCH_QUEUE_MIN_DELAY_SECONDS)
      )
      return
    }

    const hasDonorSearchMaxRetryReached =
      retryCount >= Number(process.env.DONOR_SEARCH_MAX_RETRY_COUNT)

    if (!hasDonorSearchMaxRetryReached && !hasMaxGeohashLevelReached) {
      const delayPeriod = calculateDelayPeriod(remainingBagsNeeded, donationDateTime, urgencyLevel)
      serviceLogger.info(
        {
          retryCount: retryCount + 1,
          delayPeriod
        },
        'Enqueuing retry request'
      )
      const newDonorSearchQueueAttributes = {
        seekerId,
        requestPostId,
        createdAt,
        notifiedEligibleDonors: newNotifiedEligibleDonors,
        currentNeighborSearchLevel: updatedNeighborSearchLevel,
        remainingGeohashesToProcess: geohashesForNextIteration,
        potentialDonorsLeftToNotify: 0,
        retryCount: retryCount + 1,
        reinstatedRetryCount
      }

      await donorSearchService.enqueueDonorSearchRequest(
        newDonorSearchQueueAttributes,
        new SQSOperations(),
        delayPeriod
      )
      return
    }

    const hasDonorSearchMaxReinstatedRetryReached =
      donorSearchQueueAttributes.reinstatedRetryCount >=
      Number(process.env.DONOR_SEARCH_MAX_REINSTATED_RETRY_COUNT)

    if (!hasDonorSearchMaxReinstatedRetryReached) {
      const reinstatedDelayPeriod = calculateDelayPeriod(
        remainingBagsNeeded,
        donationDateTime,
        urgencyLevel,
        true
      )
      serviceLogger.info(
        {
          reinstatedRetryCount: reinstatedRetryCount + 1,
          reinstatedDelayPeriod
        },
        'Enqueuing reinstated retry request'
      )
      const newDonorSearchQueueAttributes = {
        seekerId,
        requestPostId,
        createdAt,
        notifiedEligibleDonors: newNotifiedEligibleDonors,
        currentNeighborSearchLevel: 0,
        remainingGeohashesToProcess: [
          geohash.slice(0, Number(process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH))
        ],
        retryCount: 0,
        reinstatedRetryCount: reinstatedRetryCount + 1,
        potentialDonorsLeftToNotify: 0,
        targetedExecutionTime: Math.floor(Date.now() / 1000) + reinstatedDelayPeriod
      }

      await donorSearchService.enqueueDonorSearchRequest(
        newDonorSearchQueueAttributes,
        new SQSOperations(),
        Number(process.env.DONOR_SEARCH_QUEUE_MIN_DELAY_SECONDS)
      )
    } else {
      await donorSearchService.updateDonorSearchRecord(
        {
          seekerId,
          requestPostId,
          createdAt,
          notifiedEligibleDonors: newNotifiedEligibleDonors,
          status: DonorSearchStatus.COMPLETED
        },
        new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
          new DonorSearchModel()
        )
      )
    }
  } catch (error) {
    if (
      error instanceof DonorSearchIntentionalError ||
      error instanceof DonorSearchOperationalError
    ) {
      serviceLogger.error(error.message)
    } else {
      serviceLogger.error(error)
    }
    throw error
  }
}

export default donorSearch

async function sendRequestNotification(
  donorSearchAttributes: DonorSearchDTO,
  eligibleDonors: Record<string, EligibleDonorInfo>
): Promise<void> {
  for (const [donorId, { locationId, distance }] of Object.entries(eligibleDonors)) {
    const notificationAttributes: DonationNotificationAttributes = {
      userId: donorId,
      title: 'Blood Request',
      body: getBloodRequestMessage(
        donorSearchAttributes.urgencyLevel,
        donorSearchAttributes.requestedBloodGroup,
        donorSearchAttributes.shortDescription ?? ''
      ),
      type: NotificationType.BLOOD_REQ_POST,
      status: AcceptDonationStatus.PENDING,
      payload: {
        seekerId: donorSearchAttributes.seekerId,
        requestPostId: donorSearchAttributes.requestPostId,
        createdAt: donorSearchAttributes.createdAt,
        locationId,
        distance,
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

async function CheckTargetedExecutionTime(
  targetedExecutionTime: number | undefined,
  receiptHandle: string,
  serviceLogger: Logger
): Promise<void> {
  const currentUnixTime = Math.floor(Date.now() / 1000)

  if (targetedExecutionTime !== undefined && targetedExecutionTime > currentUnixTime) {
    const visibilityTimeout = Math.min(targetedExecutionTime - currentUnixTime, 43200)

    await donorSearchService.updateVisibilityTimeout(
      receiptHandle,
      visibilityTimeout,
      new SQSOperations()
    )
    serviceLogger.info(`Updated message visibility timeout to ${visibilityTimeout} seconds`)
    throw new DonorSearchIntentionalError('Error for updating message visibility timeout')
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
  city: string,
  geohash: string,
  totalDonorsToNotify: number,
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
    city,
    geohash,
    updatedGeohashesToProcess,
    totalDonorsToNotify,
    notifiedEligibleDonors
  )
  const geohashesForNextIteration = updatedGeohashesToProcess.slice(processedGeohashCount)

  return {
    eligibleDonors: updatedEligibleDonors,
    updatedNeighborSearchLevel,
    geohashesForNextIteration
  }
}

async function getNewDonorsInNeighborGeohash(
  seekerId: string,
  requestedBloodGroup: string,
  city: string,
  seekerGeohash: string,
  geohashesToProcess: string[],
  totalDonorsToNotify: number,
  notifiedEligibleDonors: Record<string, EligibleDonorInfo>,
  processedGeohashCount: number = 0,
  eligibleDonors: Record<string, EligibleDonorInfo> = {}
): Promise<{
    updatedEligibleDonors: Record<string, EligibleDonorInfo>;
    processedGeohashCount: number;
  }> {
  if (
    geohashesToProcess.length === 0 ||
    processedGeohashCount >= Number(process.env.MAX_GEOHASHES_PER_PROCESSING_BATCH) ||
    Object.keys(eligibleDonors).length >= totalDonorsToNotify
  ) {
    return { updatedEligibleDonors: eligibleDonors, processedGeohashCount }
  }

  const geohashToProcess = geohashesToProcess[0]
  const donors = await getDonorsFromCache(geohashToProcess, city, requestedBloodGroup)

  const updatedEligibleDonors = donors.reduce<Record<string, EligibleDonorInfo>>(
    (donorAccumulator, donor) => {
      const donorDistance = getDistanceBetweenGeohashes(seekerGeohash, geohashToProcess)
      if (
        donor.userId !== seekerId &&
        (donorAccumulator[donor.userId] === undefined ||
          donorAccumulator[donor.userId].distance < donorDistance) &&
        notifiedEligibleDonors[donor.userId] === undefined
      ) {
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
    city,
    seekerGeohash,
    geohashesToProcess.slice(1),
    totalDonorsToNotify,
    notifiedEligibleDonors,
    processedGeohashCount + 1,
    updatedEligibleDonors
  )
}

async function getDonorsFromCache(
  geohashToProcess: string,
  city: string,
  requestedBloodGroup: string
): Promise<DonorInfo[]> {
  const geohashCachePrefix = geohashToProcess.slice(
    0,
    Number(process.env.CACHE_GEOHASH_PREFIX_LENGTH)
  )
  const cacheKey = `${city}-${requestedBloodGroup}-${geohashCachePrefix}`
  const cachedGroupedGeohash = GEOHASH_CACHE.get(cacheKey) as GeohashDonorMap

  if (cachedGroupedGeohash === undefined) {
    const queriedDonors = await donorSearchService.queryGeohash(
      city,
      requestedBloodGroup,
      geohashCachePrefix,
      new GeohashDynamoDbOperations<LocationDTO, LocationFields, LocationModel>(new LocationModel())
    )
    updateGroupedGeohashCache(GEOHASH_CACHE, queriedDonors, cacheKey)
  }

  const cachedDonorMap = GEOHASH_CACHE.get(cacheKey) as GeohashDonorMap
  return cachedDonorMap[geohashToProcess] ?? []
}
