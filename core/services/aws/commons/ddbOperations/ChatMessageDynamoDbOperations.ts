import DynamoDbTableOperations from './DynamoDbTableOperations'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb'
import type { QueryInput } from '../../../../application/models/policies/repositories/QueryTypes'
import { QueryConditionOperator } from '../../../../application/models/policies/repositories/QueryTypes'
import type { ChatMessageFields } from '../ddbModels/ChatMessageModel'
import {
  CHAT_MESSAGE_PK_PREFIX,
  ChatMessageModel
} from '../ddbModels/ChatMessageModel'
import {
  CHAT_CHANNEL_METADATA_SK,
  CHAT_CHANNEL_PK_PREFIX
} from '../ddbModels/ChatChannelModel'
import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'

const MILLISECONDS_PER_SECOND = 1000
const DEDUPE_CONDITION = 'attribute_not_exists(SK)'

// A channel-status guard the caller supplies; applied atomically against the
// channel row, not the message row, so a concurrent lock cannot leak a message
// into a just-closed channel (ADV-006).
export type AddMessageGuard = {
  conditionExpression: string;
  expressionAttributeValues?: Record<string, unknown>;
  expressionAttributeNames?: Record<string, string>;
}

export type ChatHistoryPage = {
  messages: ChatMessageDTO[];
  nextCursor?: Record<string, unknown>;
}

const buildClient = (region: string): DynamoDBDocumentClient =>
  DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
    marshallOptions: { removeUndefinedValues: true }
  })

export default class ChatMessageDynamoDbOperations extends DynamoDbTableOperations<
  ChatMessageDTO,
  ChatMessageFields,
  ChatMessageModel
> {
  constructor(tableName: string, region: string) {
    super(new ChatMessageModel(), tableName, region, buildClient(region))
  }

  async addMessage(
    message: ChatMessageDTO,
    channelGuard?: AddMessageGuard
  ): Promise<ChatMessageDTO> {
    const item = this.modelAdapter.fromDto(message)
    if (channelGuard === undefined) {
      await this.putMessage(item)
    } else {
      await this.putMessageWithGuard(item, message.channelId, channelGuard)
    }

    return this.modelAdapter.toDto(item)
  }

  async getHistory(
    channelId: string,
    limit: number,
    cursor?: Record<string, unknown>
  ): Promise<ChatHistoryPage> {
    const query: QueryInput<ChatMessageFields> = {
      partitionKeyCondition: {
        attributeName: 'PK',
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${CHAT_MESSAGE_PK_PREFIX}#${channelId}`
      },
      options: { limit, scanIndexForward: false, exclusiveStartKey: cursor }
    }
    const result = await super.query(query as QueryInput<Record<string, unknown>>)

    return { messages: result.items, nextCursor: result.lastEvaluatedKey }
  }

  async countMessagesSince(
    channelId: string,
    epochSeconds: number
  ): Promise<number> {
    const threshold = new Date(epochSeconds * MILLISECONDS_PER_SECOND).toISOString()
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: '#pk = :pk AND #sk >= :sk',
      ExpressionAttributeNames: { '#pk': 'PK', '#sk': 'SK' },
      ExpressionAttributeValues: {
        ':pk': `${CHAT_MESSAGE_PK_PREFIX}#${channelId}`,
        ':sk': threshold
      },
      Select: 'COUNT'
    }))

    return result.Count ?? 0
  }

  private async putMessage(item: ChatMessageFields): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: item,
      ConditionExpression: DEDUPE_CONDITION
    }))
  }

  private async putMessageWithGuard(
    item: ChatMessageFields,
    channelId: string,
    guard: AddMessageGuard
  ): Promise<void> {
    await this.client.send(new TransactWriteCommand({
      TransactItems: [
        {
          ConditionCheck: {
            TableName: this.tableName,
            Key: {
              PK: `${CHAT_CHANNEL_PK_PREFIX}#${channelId}`,
              SK: CHAT_CHANNEL_METADATA_SK
            },
            ConditionExpression: guard.conditionExpression,
            ExpressionAttributeValues: guard.expressionAttributeValues,
            ExpressionAttributeNames: guard.expressionAttributeNames
          }
        },
        {
          Put: {
            TableName: this.tableName,
            Item: item,
            ConditionExpression: DEDUPE_CONDITION
          }
        }
      ]
    }))
  }
}
