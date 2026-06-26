import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const RATE_PK_PREFIX = 'RATE'
const RATE_SK_PREFIX = 'MIN'
const WINDOW_MS = 60000
const WINDOW_TTL_SECONDS = 120

/**
 * Durable per-user, per-minute message counter using an atomic ADD so the limit
 * holds across concurrent Lambda containers. Rows self-expire via TTL.
 */
export default class ChatRateLimitDynamoDbOperations {
  private readonly client: DynamoDBDocumentClient

  constructor(
    private readonly tableName: string,
    region: string,
    client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }))
  ) {
    this.client = client
  }

  async incrementMessageCount(userId: string): Promise<number> {
    const windowKey = Math.floor(Date.now() / WINDOW_MS)
    const expiresAt = Math.floor(Date.now() / 1000) + WINDOW_TTL_SECONDS

    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `${RATE_PK_PREFIX}#${userId}`,
          SK: `${RATE_SK_PREFIX}#${windowKey}`
        },
        UpdateExpression: 'ADD #count :one SET #expiresAt = if_not_exists(#expiresAt, :ttl)',
        ExpressionAttributeNames: {
          '#count': 'count',
          '#expiresAt': 'expiresAt'
        },
        ExpressionAttributeValues: {
          ':one': 1,
          ':ttl': expiresAt
        },
        ReturnValues: 'UPDATED_NEW'
      })
    )

    return Number(result.Attributes?.count ?? 0)
  }
}
