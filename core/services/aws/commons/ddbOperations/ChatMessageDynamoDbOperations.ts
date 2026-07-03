import DynamoDbTableOperations from './DynamoDbTableOperations'
import {
  GetCommand,
  TransactWriteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import type { ChatMessageFields } from '../ddbModels/ChatMessageModel'
import {
  ChatMessageModel,
  CHAT_MSG_PK_PREFIX,
  CHAT_MSG_SK_PREFIX
} from '../ddbModels/ChatMessageModel'
import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import type ChatMessageRepository from '../../../../application/models/policies/repositories/ChatMessageRepository'

const DEDUP_SK_PREFIX = 'DEDUP'
const RATE_PK_PREFIX = 'CHAT_RATE'
const RATE_SK_PREFIX = 'MIN'

const isConditionalError = (error: unknown): boolean =>
  error instanceof Error
  && (error.name === 'TransactionCanceledException'
    || error.name === 'ConditionalCheckFailedException')

export default class ChatMessageDynamoDbOperations
  extends DynamoDbTableOperations<ChatMessageDTO, ChatMessageFields, ChatMessageModel>
  implements ChatMessageRepository {
  constructor(tableName: string, region: string) {
    super(new ChatMessageModel(), tableName, region)
  }

  async createMessageIdempotent(
    message: ChatMessageDTO
  ): Promise<{ created: boolean; message: ChatMessageDTO }> {
    const messageItem = this.modelAdapter.fromDto(message)
    const guardItem = {
      PK: `${CHAT_MSG_PK_PREFIX}#${message.channelId}`,
      SK: `${DEDUP_SK_PREFIX}#${message.clientMessageId}`,
      messageId: message.messageId,
      sentAt: message.sentAt,
      ttl: message.ttl
    }

    try {
      await this.client.send(
        new TransactWriteCommand({
          TransactItems: [
            { Put: { TableName: this.tableName, Item: messageItem } },
            {
              Put: {
                TableName: this.tableName,
                Item: guardItem,
                ConditionExpression: 'attribute_not_exists(SK)'
              }
            }
          ]
        })
      )

      return { created: true, message }
    } catch (error) {
      if (isConditionalError(error)) {
        const existing = await this.getExistingByGuard(message.channelId, message.clientMessageId)
        if (existing !== null) {
          return { created: false, message: existing }
        }
      }
      throw error
    }
  }

  private async getExistingByGuard(
    channelId: string,
    clientMessageId: string
  ): Promise<ChatMessageDTO | null> {
    const guard = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `${CHAT_MSG_PK_PREFIX}#${channelId}`,
          SK: `${DEDUP_SK_PREFIX}#${clientMessageId}`
        }
      })
    )
    if (guard.Item === undefined || guard.Item === null) {
      return null
    }
    const sentAt = guard.Item.sentAt as string
    const messageId = guard.Item.messageId as string

    return super.getItem(
      `${CHAT_MSG_PK_PREFIX}#${channelId}`,
      `${CHAT_MSG_SK_PREFIX}#${sentAt}#${messageId}`
    )
  }

  async queryByChannel(
    channelId: string,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: ChatMessageDTO[]; lastEvaluatedKey?: Record<string, unknown> }> {
    const query: QueryInput<ChatMessageFields> = {
      partitionKeyCondition: {
        attributeName: 'PK',
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${CHAT_MSG_PK_PREFIX}#${channelId}`
      },
      sortKeyCondition: {
        attributeName: 'SK',
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: `${CHAT_MSG_SK_PREFIX}#`
      },
      options: { scanIndexForward: false, limit, exclusiveStartKey }
    }
    const result = await super.query(query as QueryInput<Record<string, unknown>>)

    return { items: result.items, lastEvaluatedKey: result.lastEvaluatedKey }
  }

  async countSince(channelId: string, sinceIso: string, excludeSenderId: string): Promise<number> {
    let count = 0
    let startKey: Record<string, unknown> | undefined

    do {
      const query: QueryInput<ChatMessageFields> = {
        partitionKeyCondition: {
          attributeName: 'PK',
          operator: QueryConditionOperator.EQUALS,
          attributeValue: `${CHAT_MSG_PK_PREFIX}#${channelId}`
        },
        sortKeyCondition: {
          attributeName: 'SK',
          operator: QueryConditionOperator.GREATER_THAN,
          attributeValue: `${CHAT_MSG_SK_PREFIX}#${sinceIso}`
        },
        options: { exclusiveStartKey: startKey }
      }
      const result = await super.query(query as QueryInput<Record<string, unknown>>)
      count += result.items.filter((message) => message.senderId !== excludeSenderId).length
      startKey = result.lastEvaluatedKey
    } while (startKey !== undefined)

    return count
  }

  async incrementRateCounter(
    channelId: string,
    senderId: string,
    bucketMinute: string,
    ttl: number
  ): Promise<number> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `${RATE_PK_PREFIX}#${channelId}#${senderId}`,
          SK: `${RATE_SK_PREFIX}#${bucketMinute}`
        },
        UpdateExpression: 'ADD #count :one SET #ttl = if_not_exists(#ttl, :ttl)',
        ExpressionAttributeNames: { '#count': 'count', '#ttl': 'ttl' },
        ExpressionAttributeValues: { ':one': 1, ':ttl': ttl },
        ReturnValues: 'UPDATED_NEW'
      })
    )

    return Number(result.Attributes?.count ?? 0)
  }
}
