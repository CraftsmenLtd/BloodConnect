import type { SQSEvent } from 'aws-lambda'
import { DonorSearchService } from '../../../application/bloodDonationWorkflow/DonorSearchService'
import type {
  DonorSearchConfig,
  DonorSearchQueueAttributes
} from '../../../application/bloodDonationWorkflow/Types'

import SQSOperations from '../commons/sqs/SQSOperations'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import {
  DonorSearchIntentionalError,
  DonorSearchOperationalError
} from '../../../application/bloodDonationWorkflow/DonorSearchOperationalError'
import {
  AcceptDonationService 
} from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import type { GeohashDonorMap } from '../../../application/utils/GeohashCacheMapManager'
import { GeohashCacheManager } from '../../../application/utils/GeohashCacheMapManager'
import GeohashDynamoDbOperations from '../commons/ddbOperations/GeohashDynamoDbOperations'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import {
  BloodDonationService 
} from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations
  from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config'
import DonorSearchDynamoDbOperations from '../commons/ddbOperations/DonorSearchDynamoDbOperations'
import DonationNotificationDynamoDbOperations
  from '../commons/ddbOperations/DonationNotificationDynamoDbOperations'
import AcceptDonationDynamoDbOperations
  from '../commons/ddbOperations/AcceptedDonationDynamoDbOperations'
import {
  GeohashService 
} from 'core/application/bloodDonationWorkflow/GeohashService'

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

  const serviceLogger = createServiceLogger(seekerId, {
    requestPostId: requestPostId,
    createdAt: createdAt
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
  const notificationService = new NotificationService(notificationDynamoDbOperations, serviceLogger)
  const acceptDonationService = new AcceptDonationService(
    acceptDonationDynamoDbOperations,
    serviceLogger
  )
  const geohashService = new GeohashService(geohashDynamoDbOperations, serviceLogger, config)

  try {
    await donorSearchService.searchDonors({
      seekerId,
      requestPostId,
      createdAt,
      targetedExecutionTime,
      remainingDonorsToFind,
      currentNeighborSearchLevel,
      remainingGeohashesToProcess,
      initiationCount,
      notifiedEligibleDonors,
      receiptHandle: record.receiptHandle,
      bloodDonationService,
      acceptDonationService,
      notificationService,
      geohashService,
      queueModel: new SQSOperations(),
      geohashCache: GEOHASH_CACHE
    })
  } catch (error) {
    serviceLogger.error(
      error instanceof DonorSearchIntentionalError || error instanceof DonorSearchOperationalError
        ? error.message
        : error
    )
    throw error
  }
}

export default donorSearchLambda
