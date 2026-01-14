import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import {
  AcceptDonationService
} from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import AcceptDonationDynamoDbOperations from '../commons/ddbOperations/AcceptedDonationDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const bloodDonationDynamoDbOperations = new BloodDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const acceptDonationDynamoDbOperations = new AcceptDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

// EventBridge Pipe event format
interface DonationStatusEvent {
  PK: string
  SK: string
  createdAt: string
}

async function donationStatusManager(
  event: DonationStatusEvent | DonationStatusEvent[]
): Promise<{ status: string }> {
  try {
    // Normalize to array (EventBridge Pipe with batch_size > 1 sends array)
    const events = Array.isArray(event) ? event : [event]

    for (const body of events) {
      await processDonationStatusEvent(body)
    }

    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE)
  }
}

async function processDonationStatusEvent(body: DonationStatusEvent): Promise<void> {
  const primaryIndex: string = body.PK
  const secondaryIndex: string = body.SK
  const createdAt: string = body.createdAt

  if (primaryIndex === '' || secondaryIndex === '') {
    throw new Error('Missing PK or SK in the DynamoDB record')
  }

  const seekerId = primaryIndex.split('#')[1]
  const requestPostId = secondaryIndex.split('#')[1]

  const serviceLogger = createServiceLogger(seekerId, { requestPostId, createdAt })

  const bloodDonationService = new BloodDonationService(
    bloodDonationDynamoDbOperations,
    serviceLogger
  )
  const acceptDonationService = new AcceptDonationService(
    acceptDonationDynamoDbOperations,
    serviceLogger
  )

  await bloodDonationService.checkAndUpdateDonationStatus(
    seekerId,
    requestPostId,
    createdAt,
    acceptDonationService
  )
}

export default donationStatusManager
