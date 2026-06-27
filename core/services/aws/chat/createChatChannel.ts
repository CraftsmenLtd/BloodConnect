import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from '../../../../commons/libs/config/config'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { ChatChannelService } from '../../../application/chatWorkflow/ChatChannelService'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'

// Standalone create-if-missing channel entry. The acceptance flow calls
// ChatChannelService.ensureChannel() directly (the primary path, ADR-001); this
// handler exists for reuse/testing and for backfilling a channel that a partial
// failure left missing (ADV-001). ensureChannel is idempotent, so a re-invoke is safe.
const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const chatChannelDynamoDbOperations = new ChatChannelDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

type CreateChatChannelEvent = {
  seekerId: string;
  requestPostId: string;
  donorId: string;
  createdAt?: string;
}

const hasAllParticipants = (event: CreateChatChannelEvent): boolean =>
  Boolean(event.seekerId) && Boolean(event.requestPostId) && Boolean(event.donorId)

const createChatChannel = async (
  event: CreateChatChannelEvent
): Promise<APIGatewayProxyResult> => {
  if (!hasAllParticipants(event)) {
    return generateApiGatewayResponse(
      { message: 'Missing channel participants' },
      HTTP_CODES.BAD_REQUEST
    )
  }

  const chatChannelService = new ChatChannelService(chatChannelDynamoDbOperations)
  try {
    const channel = await chatChannelService.ensureChannel(
      event.seekerId,
      event.requestPostId,
      event.donorId,
      event.createdAt
    )

    return generateApiGatewayResponse({ channelId: channel.channelId }, HTTP_CODES.OK)
  } catch (error) {
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE

    return generateApiGatewayResponse({ message }, HTTP_CODES.ERROR)
  }
}

export default createChatChannel
