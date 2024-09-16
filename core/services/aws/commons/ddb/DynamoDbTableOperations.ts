import { DbModelDtoAdapter, NosqlModel } from '@application/technicalImpl/dbModels/DbModelDefinitions'
import Repository from '@application/technicalImpl/policies/repositories/Repository'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { DTO } from '@commons/dto/DTOCommon'
import { GenericCodes } from '@commons/libs/constants/GenericCodes'
import DatabaseError from '@commons/libs/errors/DatabaseError'

export default class DynamoDbTableOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> implements Repository<Dto> {
  constructor(
    private readonly modelAdapter: ModelAdapter,
    private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }))
  ) {}

  async create(item: Dto): Promise<Dto> {
    const command = new PutCommand({
      TableName: this.getTableName(),
      Item: this.modelAdapter.fromDto(item)
    })
    const putCommandOutput = await this.client.send(command)
    console.log('putCommandOutput', putCommandOutput)
    if (putCommandOutput.Attributes != null) {
      return this.modelAdapter.toDto(putCommandOutput.Attributes as DbFields)
    }
    throw new Error('Failed to create item in DynamoDB. property "putCommandOutput.Attributes" is undefined')
  }

  getTableName(): string {
    if (process.env.DYNAMODB_TABLE_NAME == null) {
      throw new DatabaseError('DDB Table name not defined', GenericCodes.error)
    }
    return process.env.DYNAMODB_TABLE_NAME
  }
}
