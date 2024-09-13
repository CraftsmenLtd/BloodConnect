import { Repository } from './Repository'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, PutCommandOutput } from '@aws-sdk/lib-dynamodb'

export class DynamoDBTableOperations<T extends Record<string, unknown>> implements Repository<T, PutCommandOutput> {
  private readonly client: DynamoDBDocumentClient

  constructor() {
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }))
  }

  async createItem(item: T): Promise<PutCommandOutput> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName(),
        Item: item
      })
      return await this.client.send(command)
    } catch (error) {
      throw new Error('Failed to create item in DynamoDB')
    }
  }

  getTableName(): string {
    return process.env.DYNAMODB_TABLE_NAME ?? ''
  }
}
