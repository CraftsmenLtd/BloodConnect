import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import type ChatRateLimitRepository from '../../../../application/models/policies/repositories/ChatRateLimitRepository'

export const CHAT_RATE_LIMIT_PK_PREFIX = 'CHATRATE'
export const CHAT_RATE_LIMIT_SK_PREFIX = 'WINDOW'

// Atomic per-channel rate limiter: a single conditional UpdateCommand increments the current
// window's counter only while it is below the limit, so concurrent sends cannot race past it.
// The counter item carries a TTL so spent windows self-purge.
export default class ChatRateLimitDynamoDbOperations implements ChatRateLimitRepository {
  constructor(
    private readonly tableName: string,
    region: string,
    private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }))
  ) {}

  async tryConsume(channelId: string, limit: number, windowSeconds: number): Promise<boolean> {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const windowStart = nowSeconds - (nowSeconds % windowSeconds)

    try {
      await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `${CHAT_RATE_LIMIT_PK_PREFIX}#${channelId}`,
          SK: `${CHAT_RATE_LIMIT_SK_PREFIX}#${windowStart}`
        },
        UpdateExpression: 'SET #ttl = if_not_exists(#ttl, :ttl) ADD #count :one',
        ConditionExpression: 'attribute_not_exists(#count) OR #count < :limit',
        ExpressionAttributeNames: { '#count': 'count', '#ttl': 'ttl' },
        ExpressionAttributeValues: {
          ':one': 1,
          ':limit': limit,
          ':ttl': windowStart + windowSeconds * 2
        }
      }))

      return true
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false
      }
      throw error
    }
  }
}
