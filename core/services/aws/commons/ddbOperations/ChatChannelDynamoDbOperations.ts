import DynamoDbTableOperations from './DynamoDbTableOperations'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import type {
  ChatChannelFields,
  ChatInboxPointerFields
} from '../ddbModels/ChatChannelModel'
import {
  CHAT_CHANNEL_METADATA_SK,
  CHAT_CHANNEL_PK_PREFIX,
  ChatChannelModel
} from '../ddbModels/ChatChannelModel'
import { USER_PK_PREFIX } from '../ddbModels/UserModel'
import type {
  ChatChannelDTO,
  ChatChannelStatus
} from '../../../../../commons/dto/ChatDTO'

const LOCKED_STATUS: ChatChannelStatus = 'LOCKED'
const UNREAD_INCREMENT = 1
const UNREAD_RESET = 0

const buildClient = (region: string): DynamoDBDocumentClient =>
  DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
    marshallOptions: { removeUndefinedValues: true }
  })

export default class ChatChannelDynamoDbOperations extends DynamoDbTableOperations<
  ChatChannelDTO,
  ChatChannelFields,
  ChatChannelModel
> {
  constructor(tableName: string, region: string) {
    super(new ChatChannelModel(), tableName, region, buildClient(region))
  }

  // Idempotent: the channel row's attribute_not_exists(PK) guard gates the whole
  // transaction, so a re-create leaves the channel + both pointers untouched (ADV-001).
  async createChannel(channel: ChatChannelDTO): Promise<ChatChannelDTO> {
    const channelItem = this.modelAdapter.fromDto(channel)
    const pointers = this.modelAdapter.toInboxPointers(channel)
    const command = new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: this.tableName,
            Item: channelItem,
            ConditionExpression: 'attribute_not_exists(PK)'
          }
        },
        ...pointers.map((pointer) => ({
          Put: { TableName: this.tableName, Item: pointer }
        }))
      ]
    })
    try {
      await this.client.send(command)
    } catch (error) {
      if (!(error instanceof TransactionCanceledException)) {
        throw error
      }
    }

    return this.modelAdapter.toDto(channelItem)
  }

  async getChannel(channelId: string): Promise<ChatChannelDTO | null> {
    return super.getItem(
      `${CHAT_CHANNEL_PK_PREFIX}#${channelId}`,
      CHAT_CHANNEL_METADATA_SK
    )
  }

  async listChannelsForUser(userId: string): Promise<ChatInboxPointerFields[]> {
    return this.queryPointers(userId, `${CHAT_CHANNEL_PK_PREFIX}#`)
  }

  async listChannelsForRequest(
    seekerId: string,
    requestPostId: string
  ): Promise<ChatInboxPointerFields[]> {
    return this.queryPointers(
      seekerId,
      `${CHAT_CHANNEL_PK_PREFIX}#${seekerId}#${requestPostId}#`
    )
  }

  async lockChannel(channelId: string): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: this.channelKey(channelId),
      UpdateExpression: 'SET #status = :locked, lockedAt = :lockedAt',
      ConditionExpression: 'attribute_exists(PK)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':locked': LOCKED_STATUS,
        ':lockedAt': new Date().toISOString()
      }
    }))
  }

  async incrementUnread(
    userId: string,
    channelId: string,
    preview: string
  ): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: this.pointerKey(userId, channelId),
      UpdateExpression: 'SET lastMessagePreview = :preview ADD unreadCount :inc',
      ExpressionAttributeValues: { ':preview': preview, ':inc': UNREAD_INCREMENT }
    }))
  }

  async resetUnread(userId: string, channelId: string): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: this.pointerKey(userId, channelId),
      UpdateExpression: 'SET unreadCount = :zero',
      ExpressionAttributeValues: { ':zero': UNREAD_RESET }
    }))
  }

  private async queryPointers(
    userId: string,
    skPrefix: string
  ): Promise<ChatInboxPointerFields[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeNames: { '#pk': 'PK', '#sk': 'SK' },
      ExpressionAttributeValues: {
        ':pk': `${USER_PK_PREFIX}#${userId}`,
        ':sk': skPrefix
      }
    }))

    return (result.Items ?? []) as ChatInboxPointerFields[]
  }

  private channelKey(channelId: string): Record<string, string> {
    return {
      PK: `${CHAT_CHANNEL_PK_PREFIX}#${channelId}`,
      SK: CHAT_CHANNEL_METADATA_SK
    }
  }

  private pointerKey(userId: string, channelId: string): Record<string, string> {
    return {
      PK: `${USER_PK_PREFIX}#${userId}`,
      SK: `${CHAT_CHANNEL_PK_PREFIX}#${channelId}`
    }
  }
}
