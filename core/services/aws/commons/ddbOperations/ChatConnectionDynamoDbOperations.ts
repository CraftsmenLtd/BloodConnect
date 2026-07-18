import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  GetCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import type { ChatConnectionDTO } from '../../../../../commons/dto/ChatDTO'
import type ChatConnectionRepository from '../../../../application/models/policies/repositories/ChatConnectionRepository'
import {
  ChatConnectionModel,
  CHAT_CONNECTION_PK_PREFIX,
  CHAT_CONNECTION_GSI1PK_PREFIX
} from '../ddbModels/ChatConnectionModel'
import type { ChatConnectionFields } from '../ddbModels/ChatConnectionModel'

// Live WebSocket connections keyed by connectionId ($disconnect carries only connectionId), with
// GSI1 on userId so a message can fan out to all of a recipient's open connections.
export default class ChatConnectionDynamoDbOperations implements ChatConnectionRepository {
  private readonly model = new ChatConnectionModel()

  constructor(
    private readonly tableName: string,
    region: string,
    private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }))
  ) {}

  async put(connection: ChatConnectionDTO): Promise<ChatConnectionDTO> {
    const item = this.model.fromDto(connection)
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }))

    return this.model.toDto(item)
  }

  async getByConnectionId(connectionId: string): Promise<ChatConnectionDTO | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `${CHAT_CONNECTION_PK_PREFIX}#${connectionId}`,
        SK: `${CHAT_CONNECTION_PK_PREFIX}#${connectionId}`
      }
    }))
    if (result.Item === null || result.Item === undefined) {
      return null
    }

    return this.model.toDto(result.Item as ChatConnectionFields)
  }

  async deleteByConnectionId(connectionId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `${CHAT_CONNECTION_PK_PREFIX}#${connectionId}`,
        SK: `${CHAT_CONNECTION_PK_PREFIX}#${connectionId}`
      }
    }))
  }

  async queryByUserId(userId: string): Promise<ChatConnectionDTO[]> {
    const gsiIndex = this.model.getIndex('GSI', 'GSI1')
    if (gsiIndex === undefined) {
      throw new Error('GSI1 index not found on ChatConnectionModel.')
    }

    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': String(gsiIndex.partitionKey) },
      ExpressionAttributeValues: {
        ':pk': `${CHAT_CONNECTION_GSI1PK_PREFIX}#${userId}`
      }
    }))

    return (result.Items ?? []).map(
      (item) => this.model.toDto(item as ChatConnectionFields)
    )
  }
}
