import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { ChatService } from '../../../application/chatWorkflow/ChatService'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import ChatDynamoDbOperations from '../commons/ddbOperations/ChatDynamoDbOperations'
import ChatRateLimitDynamoDbOperations from '../commons/ddbOperations/ChatRateLimitDynamoDbOperations'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
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
const chatDynamoDbOperations = new ChatDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const chatRateLimitDynamoDbOperations = new ChatRateLimitDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

// EventBridge pipe payload (INSERT of an ACCEPTED# record): PK=BLOOD_REQ#<seekerId>,
// SK=ACCEPTED#<requestPostId>#<donorId>, createdAt is the donation post's createdAt.
type ChannelCreateEvent = {
  PK: string;
  SK: string;
  createdAt: string;
}

async function chatChannelCreator(
  event: ChannelCreateEvent | ChannelCreateEvent[]
): Promise<{ status: string }> {
  try {
    const events = Array.isArray(event) ? event : [event]
    for (const body of events) {
      await processChannelCreateEvent(body)
    }

    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE)
  }
}

async function processChannelCreateEvent(body: ChannelCreateEvent): Promise<void> {
  if (body.PK === '' || body.SK === '') {
    throw new Error('Missing PK or SK in the DynamoDB record')
  }

  const seekerId = body.PK.split('#')[1]
  const [, requestPostId, donorId] = body.SK.split('#')

  const logger = createServiceLogger(seekerId, { requestPostId, donorId, createdAt: body.createdAt })
  const bloodDonationService = new BloodDonationService(bloodDonationDynamoDbOperations, logger)
  const chatService = new ChatService(
    chatDynamoDbOperations,
    chatRateLimitDynamoDbOperations,
    logger
  )

  // Read the donation post to snapshot the request context onto the channel, so the chat header
  // renders on a cold-start deep-link without a separate post fetch.
  const donationPost = await bloodDonationService.getDonationRequest(
    seekerId,
    requestPostId,
    body.createdAt
  )

  await chatService.openChannel({
    seekerId,
    requestPostId,
    donorId,
    context: {
      requestedBloodGroup: donationPost.requestedBloodGroup,
      urgencyLevel: donationPost.urgencyLevel,
      donationDateTime: donationPost.donationDateTime,
      location: donationPost.location
    }
  })
}

export default chatChannelCreator
