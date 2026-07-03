import DynamoDbTableOperations from './DynamoDbTableOperations'
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import type { ChatChannelFields } from '../ddbModels/ChatChannelModel'
import {
  ChatChannelModel,
  CHAT_CHANNEL_PK_PREFIX,
  CHAT_CHANNEL_SK
} from '../ddbModels/ChatChannelModel'
import type { ChatMembershipFields } from '../ddbModels/ChatChannelMembershipModel'
import {
  ChatChannelMembershipModel,
  CHAT_USER_PK_PREFIX,
  CHAT_MEMBERSHIP_SK_PREFIX
} from '../ddbModels/ChatChannelMembershipModel'
import type {
  ChatChannelDTO,
  ChannelMembershipDTO,
  ChatChannelStatus
} from '../../../../../commons/dto/ChatDTO'
import type ChatChannelRepository from '../../../../application/models/policies/repositories/ChatChannelRepository'

const isConditionalError = (error: unknown): boolean =>
  error instanceof Error
  && (error.name === 'TransactionCanceledException'
    || error.name === 'ConditionalCheckFailedException')

export default class ChatChannelDynamoDbOperations
  extends DynamoDbTableOperations<ChatChannelDTO, ChatChannelFields, ChatChannelModel>
  implements ChatChannelRepository {
  private readonly membershipModel: ChatChannelMembershipModel

  constructor(tableName: string, region: string) {
    super(new ChatChannelModel(), tableName, region)
    this.membershipModel = new ChatChannelMembershipModel()
  }

  async getChannel(channelId: string): Promise<ChatChannelDTO | null> {
    return super.getItem(`${CHAT_CHANNEL_PK_PREFIX}#${channelId}`, CHAT_CHANNEL_SK)
  }

  async createChannelIfAbsent(
    channel: ChatChannelDTO,
    memberships: ChannelMembershipDTO[]
  ): Promise<{ created: boolean; channel: ChatChannelDTO }> {
    const channelItem = this.modelAdapter.fromDto(channel)
    const membershipItems = memberships.map((membership) => this.membershipModel.fromDto(membership))

    try {
      await this.client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: this.tableName,
                Item: channelItem,
                ConditionExpression: 'attribute_not_exists(PK)'
              }
            },
            ...membershipItems.map((item) => ({
              Put: { TableName: this.tableName, Item: item }
            }))
          ]
        })
      )

      return { created: true, channel }
    } catch (error) {
      if (isConditionalError(error)) {
        const existing = await this.getChannel(channel.channelId)
        if (existing !== null) {
          return { created: false, channel: existing }
        }
      }
      throw error
    }
  }

  async updateStatus(channelId: string, status: ChatChannelStatus): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { PK: `${CHAT_CHANNEL_PK_PREFIX}#${channelId}`, SK: CHAT_CHANNEL_SK },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status }
      })
    )
  }

  async updateLastMessageForMembers(
    memberUserIds: string[],
    channelId: string,
    lastMessageAt: string,
    lastMessagePreview: string
  ): Promise<void> {
    await Promise.all(
      memberUserIds.map((userId) =>
        this.client.send(
          new UpdateCommand({
            TableName: this.tableName,
            Key: {
              PK: `${CHAT_USER_PK_PREFIX}#${userId}`,
              SK: `${CHAT_MEMBERSHIP_SK_PREFIX}#${channelId}`
            },
            UpdateExpression:
              'SET lastMessageAt = :at, lastMessagePreview = :preview, GSI1SK = :gsi1sk',
            ExpressionAttributeValues: {
              ':at': lastMessageAt,
              ':preview': lastMessagePreview,
              ':gsi1sk': `${lastMessageAt}#${channelId}`
            }
          })
        )
      )
    )
  }

  async queryChannelsByUser(
    userId: string,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: ChannelMembershipDTO[]; lastEvaluatedKey?: Record<string, unknown> }> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: { '#pk': 'GSI1PK' },
        ExpressionAttributeValues: { ':pk': `${CHAT_USER_PK_PREFIX}#${userId}` },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey
      })
    )

    return {
      items: (result.Items ?? []).map((item) =>
        this.membershipModel.toDto(item as ChatMembershipFields)
      ),
      lastEvaluatedKey: result.LastEvaluatedKey
    }
  }

  async getMembership(userId: string, channelId: string): Promise<ChannelMembershipDTO | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `${CHAT_USER_PK_PREFIX}#${userId}`,
          SK: `${CHAT_MEMBERSHIP_SK_PREFIX}#${channelId}`
        }
      })
    )
    if (result.Item === undefined || result.Item === null) {
      return null
    }

    return this.membershipModel.toDto(result.Item as ChatMembershipFields)
  }

  async updateLastReadAt(userId: string, channelId: string, lastReadAt: string): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `${CHAT_USER_PK_PREFIX}#${userId}`,
          SK: `${CHAT_MEMBERSHIP_SK_PREFIX}#${channelId}`
        },
        UpdateExpression: 'SET lastReadAt = :lastReadAt',
        ExpressionAttributeValues: { ':lastReadAt': lastReadAt }
      })
    )
  }
}
