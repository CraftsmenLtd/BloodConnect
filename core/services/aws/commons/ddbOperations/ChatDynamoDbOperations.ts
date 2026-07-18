import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import { ChatChannelStatus } from '../../../../../commons/dto/ChatDTO'
import type {
  ChatChannelDTO,
  ChatMembershipDTO,
  ChatMessageDTO
} from '../../../../../commons/dto/ChatDTO'
import type ChatRepository from '../../../../application/models/policies/repositories/ChatRepository'
import type { ChatHistoryPage } from '../../../../application/models/policies/repositories/ChatRepository'
import {
  ChatChannelModel,
  CHAT_CHANNEL_PK_PREFIX,
  CHAT_CHANNEL_SK_PREFIX
} from '../ddbModels/ChatChannelModel'
import type { ChatChannelFields } from '../ddbModels/ChatChannelModel'
import {
  ChatMembershipModel,
  CHAT_MEMBERSHIP_PK_PREFIX,
  CHAT_MEMBERSHIP_SK_PREFIX
} from '../ddbModels/ChatMembershipModel'
import type { ChatMembershipFields } from '../ddbModels/ChatMembershipModel'
import {
  ChatMessageModel,
  CHAT_MESSAGE_PK_PREFIX
} from '../ddbModels/ChatMessageModel'
import type { ChatMessageFields } from '../ddbModels/ChatMessageModel'

// Composite adapter for the chat channel, per-participant membership, and message item shapes,
// which share the single table but are distinct entities (so this does not extend the single-model
// DynamoDbTableOperations base).
export default class ChatDynamoDbOperations implements ChatRepository {
  private readonly channelModel = new ChatChannelModel()
  private readonly membershipModel = new ChatMembershipModel()
  private readonly messageModel = new ChatMessageModel()

  constructor(
    private readonly tableName: string,
    region: string,
    private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }))
  ) {}

  private channelKey(seekerId: string, requestPostId: string, donorId: string): {
    PK: string;
    SK: string;
  } {
    return {
      PK: `${CHAT_CHANNEL_PK_PREFIX}#${seekerId}#${requestPostId}`,
      SK: `${CHAT_CHANNEL_SK_PREFIX}#${donorId}`
    }
  }

  private membershipKey(userId: string, channelId: string): { PK: string; SK: string } {
    return {
      PK: `${CHAT_MEMBERSHIP_PK_PREFIX}#${userId}`,
      SK: `${CHAT_MEMBERSHIP_SK_PREFIX}#${channelId}`
    }
  }

  // Create-or-reopen: sets status to OPEN and refreshes the context snapshot, preserving the
  // original createdAt and any existing lastMessageAt so re-accept does not wipe conversation state.
  async upsertChannelOpen(channel: ChatChannelDTO): Promise<ChatChannelDTO> {
    const result = await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: this.channelKey(channel.seekerId, channel.requestPostId, channel.donorId),
      UpdateExpression:
        'SET #status = :status, #context = :context, #createdAt = if_not_exists(#createdAt, :createdAt)',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#context': 'context',
        '#createdAt': 'createdAt'
      },
      ExpressionAttributeValues: {
        ':status': ChatChannelStatus.OPEN,
        ':context': channel.context,
        ':createdAt': channel.createdAt
      },
      ReturnValues: 'ALL_NEW'
    }))

    // ALL_NEW returns the persisted item, so on a re-open the original createdAt (preserved by
    // if_not_exists) is reflected rather than the caller-supplied timestamp.
    return this.channelModel.toDto(result.Attributes as ChatChannelFields)
  }

  // Conditional lock: no-op when the channel does not exist (so a REMOVE pipe for an unaccepted
  // request never materialises a phantom locked record).
  async lockChannel(seekerId: string, requestPostId: string, donorId: string): Promise<void> {
    try {
      await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: this.channelKey(seekerId, requestPostId, donorId),
        UpdateExpression: 'SET #status = :status',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': ChatChannelStatus.LOCKED }
      }))
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException)) {
        throw error
      }
    }
  }

  async listChannelsForRequest(
    seekerId: string,
    requestPostId: string
  ): Promise<ChatChannelDTO[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': 'PK' },
      ExpressionAttributeValues: {
        ':pk': `${CHAT_CHANNEL_PK_PREFIX}#${seekerId}#${requestPostId}`
      }
    }))

    return (result.Items ?? []).map(
      (item) => this.channelModel.toDto(item as ChatChannelFields)
    )
  }

  async getChannel(
    seekerId: string,
    requestPostId: string,
    donorId: string
  ): Promise<ChatChannelDTO | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: this.channelKey(seekerId, requestPostId, donorId)
    }))
    if (result.Item === null || result.Item === undefined) {
      return null
    }

    return this.channelModel.toDto(result.Item as ChatChannelFields)
  }

  async updateChannelLastMessage(
    seekerId: string,
    requestPostId: string,
    donorId: string,
    lastMessageAt: string
  ): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: this.channelKey(seekerId, requestPostId, donorId),
      UpdateExpression: 'SET #lastMessageAt = :lastMessageAt',
      ExpressionAttributeNames: { '#lastMessageAt': 'lastMessageAt' },
      ExpressionAttributeValues: { ':lastMessageAt': lastMessageAt }
    }))
  }

  // Upserts the participant's membership, preserving lastReadAt/lastMessageAt across a re-open.
  async upsertMembership(membership: ChatMembershipDTO): Promise<ChatMembershipDTO> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: this.membershipKey(membership.userId, membership.channelId),
      UpdateExpression: 'SET #role = :role, #createdAt = if_not_exists(#createdAt, :createdAt)',
      ExpressionAttributeNames: { '#role': 'role', '#createdAt': 'createdAt' },
      ExpressionAttributeValues: {
        ':role': membership.role,
        ':createdAt': membership.createdAt
      }
    }))

    return membership
  }

  async listMembershipsByUser(userId: string): Promise<ChatMembershipDTO[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeNames: { '#pk': 'PK', '#sk': 'SK' },
      ExpressionAttributeValues: {
        ':pk': `${CHAT_MEMBERSHIP_PK_PREFIX}#${userId}`,
        ':sk': `${CHAT_MEMBERSHIP_SK_PREFIX}#`
      }
    }))

    return (result.Items ?? []).map(
      (item) => this.membershipModel.toDto(item as ChatMembershipFields)
    )
  }

  async updateLastRead(userId: string, channelId: string, lastReadAt: string): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: this.membershipKey(userId, channelId),
      UpdateExpression: 'SET #lastReadAt = :lastReadAt',
      ExpressionAttributeNames: { '#lastReadAt': 'lastReadAt' },
      ExpressionAttributeValues: { ':lastReadAt': lastReadAt }
    }))
  }

  async updateMembershipLastMessage(
    userId: string,
    channelId: string,
    lastMessageAt: string
  ): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: this.membershipKey(userId, channelId),
      UpdateExpression: 'SET #lastMessageAt = :lastMessageAt',
      ExpressionAttributeNames: { '#lastMessageAt': 'lastMessageAt' },
      ExpressionAttributeValues: { ':lastMessageAt': lastMessageAt }
    }))
  }

  async putMessage(message: ChatMessageDTO): Promise<ChatMessageDTO> {
    const item = this.messageModel.fromDto(message)
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }))

    return this.messageModel.toDto(item)
  }

  // Newest-first page: descending sort key order, with the optional cursor for the next page.
  async queryMessages(
    channelId: string,
    limit?: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<ChatHistoryPage> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': 'PK' },
      ExpressionAttributeValues: { ':pk': `${CHAT_MESSAGE_PK_PREFIX}#${channelId}` },
      ScanIndexForward: false,
      ...(limit !== undefined && limit > 0 ? { Limit: limit } : {}),
      ...(exclusiveStartKey !== undefined ? { ExclusiveStartKey: exclusiveStartKey } : {})
    }))

    return {
      items: (result.Items ?? []).map(
        (item) => this.messageModel.toDto(item as ChatMessageFields)
      ),
      lastEvaluatedKey: result.LastEvaluatedKey
    }
  }
}
