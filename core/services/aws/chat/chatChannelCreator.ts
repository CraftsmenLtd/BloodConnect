import type { DynamoDBStreamEvent, DynamoDBBatchResponse, DynamoDBRecord } from 'aws-lambda'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import AcceptDonationDynamoDbOperations from '../commons/ddbOperations/AcceptedDonationDynamoDbOperations'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import {
  AcceptDonationService
} from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { ChatChannelService } from '../../../application/chatWorkflow/ChatChannelService'
import { ChannelLifecycleService } from '../../../application/chatWorkflow/ChannelLifecycleService'
import {
  classifyStreamItem,
  parseAcceptanceKeys,
  parseRequestKeys,
  LifecycleAction
} from '../../../application/chatWorkflow/streamClassifier'

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
const chatChannelDynamoDbOperations = new ChatChannelDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

const asString = (value: unknown): string => (typeof value === 'string' ? value : '')

async function chatChannelCreator(event: DynamoDBStreamEvent): Promise<DynamoDBBatchResponse> {
  const batchItemFailures: DynamoDBBatchResponse['batchItemFailures'] = []

  for (const record of event.Records) {
    const failed = await processRecord(record)
    if (failed) {
      batchItemFailures.push({ itemIdentifier: record.dynamodb?.SequenceNumber ?? '' })
    }
  }

  return { batchItemFailures }
}

async function processRecord(record: DynamoDBRecord): Promise<boolean> {
  const image = record.dynamodb?.NewImage
  if (image === undefined) {
    return false
  }
  const logger = createServiceLogger('chatChannelCreator')

  try {
    const item = unmarshall(image as unknown as Record<string, AttributeValue>)
    const pk = asString(item.PK)
    const sk = asString(item.SK)
    const action = classifyStreamItem({
      pk,
      sk,
      eventName: record.eventName ?? '',
      status: typeof item.status === 'string' ? item.status : undefined
    })

    if (action === LifecycleAction.NOOP) {
      return false
    }

    const channelService = new ChatChannelService(chatChannelDynamoDbOperations, logger)
    const lifecycle = new ChannelLifecycleService(logger)

    if (action === LifecycleAction.CREATE_CHANNEL) {
      const { seekerId, requestPostId, donorId } = parseAcceptanceKeys(pk, sk)
      const bloodDonationService = new BloodDonationService(bloodDonationDynamoDbOperations, logger)
      await lifecycle.onAcceptanceAccepted(
        { seekerId, requestPostId, donorId, requestCreatedAt: asString(item.createdAt) },
        bloodDonationService,
        channelService
      )
    } else {
      const { seekerId, requestPostId } = parseRequestKeys(pk, sk)
      const acceptDonationService = new AcceptDonationService(acceptDonationDynamoDbOperations, logger)
      await lifecycle.onRequestCompleted({ seekerId, requestPostId }, acceptDonationService, channelService)
    }

    return false
  } catch (error) {
    logger.error({ error, messageId: record.dynamodb?.SequenceNumber }, 'failed to process chat lifecycle stream record')

    return true
  }
}

export default chatChannelCreator
