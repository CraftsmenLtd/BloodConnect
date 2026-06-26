import { ChatService } from '../../../application/chatWorkflow/ChatService'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import ChatMessageDynamoDbOperations from '../commons/ddbOperations/ChatMessageDynamoDbOperations'
import UserChannelDynamoDbOperations from '../commons/ddbOperations/UserChannelDynamoDbOperations'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import { buildChannelId } from '../../../application/utils/chatChannel'

const config = new Config<{
  chatDynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const chatChannelOperations = new ChatChannelDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)
const chatMessageOperations = new ChatMessageDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)
const userChannelOperations = new UserChannelDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)

// EventBridge Pipe event format for a terminal acceptance stream record
type LockEvent = {
  PK: string;
  SK: string;
}

async function lockChatChannel(
  event: LockEvent | LockEvent[]
): Promise<{ status: string }> {
  try {
    const events = Array.isArray(event) ? event : [event]
    for (const body of events) {
      await processLockEvent(body)
    }

    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE)
  }
}

async function processLockEvent(body: LockEvent): Promise<void> {
  if (body.PK === '' || body.SK === '') {
    throw new Error('Missing PK or SK in the DynamoDB record')
  }

  // PK = BLOOD_REQ#<seekerId>, SK = ACCEPTED#<requestPostId>#<donorId>
  const seekerId = body.PK.split('#')[1]
  const skParts = body.SK.split('#')
  const requestPostId = skParts[1]
  const donorId = skParts[2]

  const logger = createServiceLogger(seekerId, { requestPostId, donorId })
  const chatService = new ChatService(
    chatChannelOperations,
    chatMessageOperations,
    userChannelOperations,
    logger
  )

  await chatService.lockChannel(buildChannelId(seekerId, requestPostId, donorId))
}

export default lockChatChannel
