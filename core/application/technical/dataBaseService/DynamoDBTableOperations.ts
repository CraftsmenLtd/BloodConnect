import { Repository } from './Reposoitory'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

export class DynamoDBTableOperations<T extends Record<string, unknown>> implements Repository<T> {
  private readonly client: DynamoDBDocumentClient

  constructor() {
    const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION })
    this.client = DynamoDBDocumentClient.from(ddbClient)
  }

  async createItem(item: T): Promise<T> {
    const command = new PutCommand({
      TableName: this.getTableName(),
      Item: item
    })
    await this.client.send(command)
    return item
  }

  getTableName(): string {
    return process.env.DYNAMODB_TABLE_NAME ?? ''
  }
}
