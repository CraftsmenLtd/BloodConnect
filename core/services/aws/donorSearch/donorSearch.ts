import { DonorSearchService } from '../../../application/bloodDonationWorkflow/DonorSearchService'
import type {
  DonorSearchConfig,
  DonorSearchSchedulerAttributes
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
import H3SearchDynamoDbOperations from '../commons/ddbOperations/H3SearchDynamoDbOperations'
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
import { H3SearchService } from '../../../application/bloodDonationWorkflow/H3SearchService'
import SchedulerOperations from '../commons/EventBridge/ScheduleOperations'

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
const h3SearchDynamoDbOperations = new H3SearchDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function donorSearchLambda(attributes: DonorSearchSchedulerAttributes): Promise<void> {
  const {
    seekerId,
    requestPostId,
    createdAt,
    targetedExecutionTime,
    remainingDonorsToFind,
    currentLevel,
    remainingCells,
    retryCount
  } = attributes

  const serviceLogger = createServiceLogger(seekerId, { requestPostId, createdAt })

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
  const h3SearchService = new H3SearchService(h3SearchDynamoDbOperations, serviceLogger, config)
  const schedulerModel = new SchedulerOperations(
    config.awsRegion,
    config.schedulerRoleArn,
    serviceLogger,
    config.searchIntervalSeconds
  )

  try {
    await donorSearchService.searchDonors({
      seekerId,
      requestPostId,
      createdAt,
      targetedExecutionTime,
      remainingDonorsToFind,
      currentLevel,
      remainingCells,
      retryCount,
      bloodDonationService,
      acceptDonationService,
      notificationService,
      h3SearchService,
      queueModel: new SQSOperations(config.awsRegion),
      schedulerModel
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
