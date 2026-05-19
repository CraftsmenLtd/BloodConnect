import {
  DonorSearchService
} from '../../../application/bloodDonationWorkflow/DonorSearchService'
import type {
  DonationRequestInitiatorAttributes,
  DonorSearchConfig
} from '../../../application/bloodDonationWorkflow/Types'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import {
  DonorSearchIntentionalError
} from '../../../application/bloodDonationWorkflow/DonorSearchOperationalError'
import { Config } from 'commons/libs/config/config'
import DonorSearchDynamoDbOperations from '../commons/ddbOperations/DonorSearchDynamoDbOperations'
import SchedulerOperations from '../commons/EventBridge/ScheduleOperations'

const config = new Config<DonorSearchConfig>().getConfig()

const donorSearchDynamoDbOperations = new DonorSearchDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

interface EventBridgePipeEvent {
  PK: string
  SK: string
  h3Res5: string
  h3Res8: string
  status: string
  eventName?: string
}

async function donationRequestInitiatorLambda(
  event: EventBridgePipeEvent | EventBridgePipeEvent[]
): Promise<void> {
  const events = Array.isArray(event) ? event : [event]

  for (const body of events) {
    const primaryIndex: string = body.PK
    const secondaryIndex: string = body.SK
    const seekerId = primaryIndex.split('#')[1]
    const requestPostId = secondaryIndex.split('#')[2]
    const createdAt = secondaryIndex.split('#')[1]
    const serviceLogger = createServiceLogger(seekerId, { requestPostId, createdAt })

    const donorSearchService = new DonorSearchService(
      donorSearchDynamoDbOperations,
      serviceLogger,
      config
    )

    try {
      const donationRequestInitiatorAttributes: DonationRequestInitiatorAttributes = {
        seekerId,
        requestPostId,
        createdAt,
        centerHex: body.h3Res8,
        h3Res5: body.h3Res5
      }

      await donorSearchService.initiateDonorSearchRequest(
        donationRequestInitiatorAttributes,
        new SchedulerOperations(
          config.awsRegion,
          config.schedulerRoleArn,
          serviceLogger,
          config.initialWaveDelaySeconds
        ),
        body.status,
        body.eventName
      )
    } catch (error) {
      serviceLogger.error(error instanceof DonorSearchIntentionalError ? error.message : error)
      throw error
    }
  }
}

export default donationRequestInitiatorLambda
