import { ChatService } from '../../../application/chatWorkflow/ChatService'
import ChatDynamoDbOperations from '../commons/ddbOperations/ChatDynamoDbOperations'
import ChatRateLimitDynamoDbOperations from '../commons/ddbOperations/ChatRateLimitDynamoDbOperations'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const chatDynamoDbOperations = new ChatDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const chatRateLimitDynamoDbOperations = new ChatRateLimitDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

// EventBridge pipe payload (REMOVE of an ACCEPTED# record = IGNORED): PK=BLOOD_REQ#<seekerId>,
// SK=ACCEPTED#<requestPostId>#<donorId>.
type ChannelLockEvent = {
  PK: string;
  SK: string;
  createdAt: string;
}

async function chatChannelLocker(
  event: ChannelLockEvent | ChannelLockEvent[]
): Promise<{ status: string }> {
  try {
    const events = Array.isArray(event) ? event : [event]
    for (const body of events) {
      await processChannelLockEvent(body)
    }

    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE)
  }
}

async function processChannelLockEvent(body: ChannelLockEvent): Promise<void> {
  if (body.PK === '' || body.SK === '') {
    throw new Error('Missing PK or SK in the DynamoDB record')
  }

  const seekerId = body.PK.split('#')[1]
  const [, requestPostId, donorId] = body.SK.split('#')

  const logger = createServiceLogger(seekerId, { requestPostId, donorId })
  const chatService = new ChatService(
    chatDynamoDbOperations,
    chatRateLimitDynamoDbOperations,
    logger
  )

  // Conditional lock; a no-op if the channel was never created (the adapter swallows the
  // attribute_exists check failure), so an ignore of an unchatted donor leaves no phantom record.
  await chatService.lockChannel(seekerId, requestPostId, donorId)
}

export default chatChannelLocker
