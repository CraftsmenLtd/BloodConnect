import type { SQSEvent, SQSRecord } from 'aws-lambda'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
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

async function donationStatusManager(event: SQSEvent): Promise<{ status: string }> {
  try {
    for (const record of event.Records) {
      await processSQSRecord(record)
    }
    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE)
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
  const body =
    typeof record.body === 'string' && record.body.trim() !== '' ? JSON.parse(record.body) : {}

  const primaryIndex: string = body?.PK
  const secondaryIndex: string = body?.SK
  const createdAt: string = body?.createdAt
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
