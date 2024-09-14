import Repository from '@application/policies/repositories/Repository'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { DTO } from '@commons/dto/DtoCommon'
import { GenericCodes } from '@commons/libs/constants/GenericCodes'
import DatabaseError from '@commons/libs/errors/DatabaseError'
import DbModelDtoConverter from 'core/services/aws/commons/ddb/models/DbModelDtoConverter'

export default class DynamoDbTableOperations<Dto extends DTO, ModelConverter extends DbModelDtoConverter<Dto>> implements Repository<Dto> {
  constructor(
    private readonly modelConverter: ModelConverter,
    private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }))
  ) {}

  async create(item: Dto): Promise<Dto> {
    const command = new PutCommand({
      TableName: this.getTableName(),
      Item: this.modelConverter.fromDto(item)
    })
    const putCommandOutput = await this.client.send(command)
    if (putCommandOutput.Attributes != null) {
      return this.modelConverter.toDto(putCommandOutput.Attributes)
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
