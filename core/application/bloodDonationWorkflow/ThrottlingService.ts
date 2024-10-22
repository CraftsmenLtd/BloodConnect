// import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import DatabaseError from '@commons/libs/errors/DatabaseError'
import { BLOOD_REQUEST_PK_PREFIX } from '@application/technicalImpl/dbModels/BloodDonationModel'

export class ThrottlingService {
  // private readonly ddbClient: DynamoDBDocumentClient
  private readonly MAX_REQUESTS_PER_DAY = 10
  // private readonly tableName: string

  // constructor() {
  //   const client = new DynamoDB({})
  //   this.ddbClient = DynamoDBDocumentClient.from(client)
  //   this.tableName = process.env.DYNAMODB_TABLE_NAME || ''
  // }

  constructor(
    private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }))
  ) {}

  private getCurrentDatePrefix(): string {
    return new Date().toISOString().split('T')[0] // Returns YYYY-MM-DD
  }

  async checkRequestLimit(seekerId: string): Promise<void> {
    try {
      const datePrefix = this.getCurrentDatePrefix()
      // eslint-disable-next-line no-console
      console.log(datePrefix)
      const queryCommand = new QueryCommand({
        TableName: this.getTableName(),
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
          ':sk': `${BLOOD_REQUEST_PK_PREFIX}#${datePrefix}`
        }
      })

      // const result = await this.ddbClient.send(queryCommand)
      const result = await this.client.send(queryCommand)
      // const requestCount = result.Items?.length || 0
      const requestCount = result.Items?.length ?? 0
      // eslint-disable-next-line no-console
      console.log(requestCount)

      if (requestCount >= this.MAX_REQUESTS_PER_DAY) {
        throw new BloodDonationOperationError(
          `Daily request limit exceeded. Maximum ${this.MAX_REQUESTS_PER_DAY} requests allowed per day.`,
          GENERIC_CODES.TOO_MANY_REQUESTS
        )
      }
    } catch (error) {
      if (error instanceof BloodDonationOperationError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to check request limit: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  getTableName(): string {
    if (process.env.DYNAMODB_TABLE_NAME == null) {
      throw new DatabaseError('DDB Table name not defined', GENERIC_CODES.ERROR)
    }
    return process.env.DYNAMODB_TABLE_NAME
  }
}
