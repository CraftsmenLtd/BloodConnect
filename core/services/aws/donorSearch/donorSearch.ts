import type { SQSEvent } from 'aws-lambda'
import { DonorSearchService } from '../../../application/bloodDonationWorkflow/DonorSearchService'
import type {
  DonorSearchConfig,
  DonorSearchQueueAttributes
} from '../../../application/bloodDonationWorkflow/Types'
import {
  DonorSearchStatus,
  DonationStatus
} from '../../../../commons/dto/DonationDTO'

import SQSOperations from '../commons/sqs/SQSOperations'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import {
  DonorSearchIntentionalError,
  DonorSearchOperationalError
} from '../../../application/bloodDonationWorkflow/DonorSearchOperationalError'
import {
  AcceptDonationService
} from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import {
  calculateDelayPeriod,
  calculateTotalDonorsToFind
} from '../../../application/utils/calculateDonorsToNotify'
import type {
  GeohashDonorMap
} from '../../../application/utils/GeohashCacheMapManager';
import {
  GeohashCacheManager
} from '../../../application/utils/GeohashCacheMapManager'
import GeohashDynamoDbOperations from '../commons/ddbOperations/GeohashDynamoDbOperations'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config';
import DonorSearchDynamoDbOperations from '../commons/ddbOperations/DonorSearchDynamoDbOperations';
import DonationNotificationDynamoDbOperations from '../commons/ddbOperations/DonationNotificationDynamoDbOperations';
import AcceptDonationDynamoDbOperations from '../commons/ddbOperations/AcceptedDonationDynamoDbOperations';
import { GeohashService } from 'core/application/bloodDonationWorkflow/GeohashService';

const config = new Config<DonorSearchConfig>().getConfig()

const donorSearchDynamoDbOperations = new DonorSearchDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const bloodDonationDynamoDbOperations = new BloodDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const notificationDynamoDbOperations = new DonationNotificationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const acceptDonationDynamoDbOperations = new AcceptDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const geohashDynamoDbOperations = new GeohashDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

const GEOHASH_CACHE = new GeohashCacheManager<string, GeohashDonorMap>(
  config.maxGeohashCacheEntriesCount,
  config.maxGeohashCacheMbSize,
  config.maxGeohashCacheTimeoutMinutes
)

async function donorSearchLambda(event: SQSEvent): Promise<void> {
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

  const donorSearchService = new DonorSearchService(
    donorSearchDynamoDbOperations,
    serviceLogger,
    config
  )
  const bloodDonationService = new BloodDonationService(
    bloodDonationDynamoDbOperations,
    serviceLogger
  )
  const notificationService = new NotificationService(
    notificationDynamoDbOperations,
    serviceLogger
  )
  const acceptDonationService = new AcceptDonationService(
    acceptDonationDynamoDbOperations,
    serviceLogger
  )
  const geohashService = new GeohashService(
    geohashDynamoDbOperations,
    serviceLogger,
    config
  )

  try {
    const donationPost = await bloodDonationService.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )

    if (
      donationPost.status === DonationStatus.COMPLETED ||
      donationPost.status === DonationStatus.CANCELLED
    ) {
      serviceLogger.info(`terminating process as donation status is ${donationPost.status}`)
      return
    }

    serviceLogger.info(
      `checking targeted execution time${targetedExecutionTime !== undefined ? 
        ` ${targetedExecutionTime}` : 
        ''
      }`
    )
    await donorSearchService.handleVisibilityTimeout(
      new SQSOperations(),
      targetedExecutionTime,
      record.receiptHandle
    )

    const donorSearchRecord = await donorSearchService.getDonorSearchRecord(
      seekerId,
      requestPostId,
      createdAt
    )
    if (donorSearchRecord == null) {
      serviceLogger.info('terminating process as no search record found')
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
    const remainingBagsNeeded =
      isFirstInitiation
        ? bloodQuantity
        : await acceptDonationService.getRemainingBagsNeeded(seekerId, requestPostId, bloodQuantity)

    if (remainingBagsNeeded === 0) {
      serviceLogger.info('terminating process as sufficient donors have accepted the request')
      return
    }

    const rejectedDonorsCount: number =
      isFirstInitiation ? 0 : await notificationService.getRejectedDonorsCount(requestPostId)

    const totalDonorsToFind =
      remainingDonorsToFind !== undefined && remainingDonorsToFind > 0
        ? remainingDonorsToFind + rejectedDonorsCount
        : calculateTotalDonorsToFind(remainingBagsNeeded, urgencyLevel)

    serviceLogger.info(`querying geohash to find ${totalDonorsToFind} eligible donors`)
    const { eligibleDonors, updatedNeighborSearchLevel, geohashesForNextIteration } =
      await donorSearchService.queryEligibleDonors(
        geohashService,
        GEOHASH_CACHE,
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
    await notificationService.sendRequestNotification(
      donorSearchRecord,
      eligibleDonors,
      new SQSOperations()
    )

    const hasMaxGeohashLevelReached =
      updatedNeighborSearchLevel >= config.maxGeohashNeighborSearchLevel &&
      geohashesForNextIteration.length === 0

    const nextRemainingDonorsToFind = totalDonorsToFind - Object.keys(eligibleDonors).length

    const updatedNotifiedEligibleDonors = { ...notifiedEligibleDonors, ...eligibleDonors }

    if (!hasMaxGeohashLevelReached && nextRemainingDonorsToFind > 0) {
      serviceLogger.info(
        {
          currentNeighborSearchLevel: updatedNeighborSearchLevel,
          remainingGeohashesToProcessCount: geohashesForNextIteration.length,
          remainingDonorsToFind: nextRemainingDonorsToFind,
          delayPeriod: config.donorSearchDelayBetweenExecution,
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
        config.donorSearchDelayBetweenExecution
      )
      return
    }

    const hasDonorSearchMaxInstantiatedRetryReached =
      donorSearchQueueAttributes.initiationCount >= config.donorSearchMaxInitiatingRetryCount

    if (!hasDonorSearchMaxInstantiatedRetryReached) {
      const initiatingDelayPeriod = calculateDelayPeriod(
        donationDateTime,
        config.maxGeohashPerProcessingBatch,
        config.maxGeohashesPerExecution,
        config.donorSearchMaxInitiatingRetryCount,
        config.donorSearchDelayBetweenExecution
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
            geohash.slice(0, config.neighborSearchGeohashPrefixLength)
          ],
          initiationCount: initiationCount + 1,
          remainingDonorsToFind: 0,
          targetedExecutionTime: Math.floor(Date.now() / 1000) + initiatingDelayPeriod
        },
        new SQSOperations(),
        config.donorSearchDelayBetweenExecution
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
        }
      )
    }
  } catch (error) {
    serviceLogger.error(
      error instanceof DonorSearchIntentionalError ||
      error instanceof DonorSearchOperationalError
        ? error.message
        : error
    )
    throw error
  }
}

export default donorSearchLambda
