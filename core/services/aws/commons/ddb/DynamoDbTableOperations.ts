import { DbModelDtoAdapter, NosqlModel } from '../../../../application/technicalImpl/dbModels/DbModelDefinitions'
import Repository, { QueryParams } from '../../../../application/technicalImpl/policies/repositories/Repository'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, UpdateCommandInput, UpdateCommand, GetCommandInput, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DTO } from '../../../../../commons/dto/DTOCommon'
import { GENERIC_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import DatabaseError from '../../../../../commons/libs/errors/DatabaseError'

interface CreateUpdateExpressionsReturnType {
  updateExpression: string[];
  expressionAttribute: Record<string, any>;
  expressionAttributeNames: Record<string, any>;
}
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
    const items = this.modelAdapter.fromDto(item)
    const command = new PutCommand({
      TableName: this.getTableName(),
      Item: items
    })
    const putCommandOutput = await this.client.send(command)
    if (putCommandOutput?.$metadata?.httpStatusCode === 200) {
      return this.modelAdapter.toDto(items)
    }
    throw new Error('Failed to create item in DynamoDB. property "putCommandOutput.Attributes" is undefined')
  }

  async query(params: QueryParams): Promise<Dto[]> {
    try {
      const command = new QueryCommand({
        TableName: this.getTableName(),
        KeyConditionExpression: params.keyConditionExpression,
        ExpressionAttributeValues: params.expressionAttributeValues
      })

      const result = await this.client.send(command)
      return (result.Items ?? []).map(item => this.modelAdapter.toDto(item as DbFields))
    } catch (error) {
      throw new DatabaseError('Failed to query items from DynamoDB', GENERIC_CODES.ERROR)
    }
  }

  async update(item: Dto): Promise<Dto> {
    try {
      // eslint-disable-next-line no-console
      console.log('DynamoDbTableOperations.ts - update item before fromDto', item)
      const items = this.modelAdapter.fromDto(item)
      // eslint-disable-next-line no-console
      console.log('DynamoDbTableOperations.ts - update items after fromDto', items)
      const primaryKeyName = this.modelAdapter.getPrimaryIndex()
      const updatedItem = this.removePrimaryKey(primaryKeyName.partitionKey as string, items, primaryKeyName.sortKey as string)
      const { updateExpression, expressionAttribute, expressionAttributeNames } = this.createUpdateExpressions(updatedItem)
      const keyObject: Record<string, DbFields[keyof DbFields]> = {
        [primaryKeyName.partitionKey]: items[primaryKeyName.partitionKey]
      }
      if (typeof primaryKeyName.sortKey === 'string') {
        keyObject[primaryKeyName.sortKey] = items[primaryKeyName.sortKey] as DbFields[keyof DbFields]
      }

      const input: UpdateCommandInput = {
        TableName: this.getTableName(),
        Key: keyObject,
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttribute,
        ExpressionAttributeNames: expressionAttributeNames
      }

      const updateCommandOutput = await this.client.send(new UpdateCommand(input))

      if (updateCommandOutput?.$metadata?.httpStatusCode === 200) {
        return this.modelAdapter.toDto(items)
      }
      throw new Error('Failed to update item in DynamoDB. HTTP Status Code: ' + updateCommandOutput.$metadata?.httpStatusCode)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(`Failed to update item in ${this.getTableName()}. Error: ${errorMessage}`)
    }
  }

  async getItem(partitionKey: string, sortKey?: string): Promise<Dto | null> {
    try {
      const primaryKeyName = this.modelAdapter.getPrimaryIndex()
      const key: Record<string, DbFields[keyof DbFields]> = {
        [primaryKeyName.partitionKey]: partitionKey as DbFields[keyof DbFields]
      }

      if (sortKey !== undefined && typeof primaryKeyName.sortKey === 'string') {
        key[primaryKeyName.sortKey] = sortKey as DbFields[keyof DbFields]
      }
      const input: GetCommandInput = {
        TableName: this.getTableName(),
        Key: key
      }

      const result = await this.client.send(new GetCommand(input))
      // eslint-disable-next-line no-console
      console.log('DynamoDbTableOperations.ts - result', result)
      if (result.Item === null || result.Item === undefined) {
        return null
      }
      // eslint-disable-next-line no-console
      console.log('DynamoDbTableOperations.ts - return', this.modelAdapter.toDto(result.Item as DbFields))
      return this.modelAdapter.toDto(result.Item as DbFields)
    } catch (error) {
      throw new DatabaseError('Failed to fetch item from DynamoDB', GENERIC_CODES.ERROR)
    }
  }

  getTableName(): string {
    if (process.env.DYNAMODB_TABLE_NAME == null) {
      throw new DatabaseError('DDB Table name not defined', GENERIC_CODES.ERROR)
    }
    return process.env.DYNAMODB_TABLE_NAME
  }

  private createUpdateExpressions(item: Record<string, unknown>): CreateUpdateExpressionsReturnType {
    const updateExpression: string[] = []
    const expressionAttribute: Record<string, unknown> = {}
    const expressionAttributeNames: Record<string, unknown> = {}
    Object.keys(item).forEach((key) => {
      const placeholder = `:p${key}`
      const alias = `#a${key}`
      updateExpression.push(`${alias} = ${placeholder}`)
      expressionAttribute[placeholder] = item[key]
      expressionAttributeNames[alias] = key
    })
    return { updateExpression, expressionAttribute, expressionAttributeNames }
  }

  private removePrimaryKey(partitionKeyName: string, item: Record<string, unknown>, sortKeyName?: string): Record<string, unknown> {
    const { [partitionKeyName]: _, ...rest } = { ...item }
    if (sortKeyName != null && sortKeyName !== '' && sortKeyName !== undefined) {
      const { [sortKeyName]: __, ...itemWithoutPrimaryKey } = rest
      return itemWithoutPrimaryKey
    }
    return rest
  }
}
