import { DbModelDtoAdapter, NosqlModel } from '../../../../application/technicalImpl/dbModels/DbModelDefinitions'
import Repository from '../../../../application/technicalImpl/policies/repositories/Repository'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, UpdateCommandInput, UpdateCommand, GetCommandInput, GetCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb'
import { QueryInput, QueryCondition, QueryConditionOperator } from '../../../../application/technicalImpl/policies/repositories/QueryTypes'
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

  async query(queryInput: QueryInput): Promise<{ items: Dto[]; lastEvaluatedKey?: Record<string, any> }> {
    try {
      const { keyConditionExpression, expressionAttributeValues, expressionAttributeNames } =
        this.buildKeyConditionExpression(queryInput.partitionKeyCondition, queryInput.sortKeyCondition)

      const queryCommandInput: QueryCommandInput = {
        TableName: this.getTableName(),
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames
      }

      // eslint-disable-next-line no-console
      console.log('queryCommandInput', queryCommandInput)

      // Handle options with proper null checks
      if (queryInput.options != null) {
        const {
          indexName,
          limit,
          scanIndexForward,
          exclusiveStartKey,
          filterExpression,
          filterExpressionValues
        } = queryInput.options

        if (indexName != null && indexName.trim() !== '') {
          queryCommandInput.IndexName = indexName
        }
        if (limit != null && limit > 0) {
          queryCommandInput.Limit = limit
        }
        if (scanIndexForward != null) {
          queryCommandInput.ScanIndexForward = scanIndexForward
        }
        if (exclusiveStartKey != null && Object.keys(exclusiveStartKey).length > 0) {
          queryCommandInput.ExclusiveStartKey = exclusiveStartKey
        }
        if (filterExpression != null && filterExpression.trim() !== '') {
          queryCommandInput.FilterExpression = filterExpression

          if (filterExpressionValues != null && Object.keys(filterExpressionValues).length > 0) {
            queryCommandInput.ExpressionAttributeValues = {
              ...queryCommandInput.ExpressionAttributeValues,
              ...filterExpressionValues
            }
          }
        }
      }

      const result = await this.client.send(new QueryCommand(queryCommandInput))
      // eslint-disable-next-line no-console
      console.log('result:', result)
      // eslint-disable-next-line no-console
      console.log('items:', (result.Items ?? []).map(item => this.modelAdapter.toDto(item as DbFields)))

      return {
        items: (result.Items ?? []).map(item => this.modelAdapter.toDto(item as DbFields)),
        lastEvaluatedKey: result.LastEvaluatedKey
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to query items from DynamoDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  private buildKeyConditionExpression(
    partitionKeyCondition: QueryCondition,
    sortKeyCondition?: QueryCondition
  ): {
      keyConditionExpression: string;
      expressionAttributeValues: Record<string, any>;
      expressionAttributeNames: Record<string, any>;
    } {
    const expressionAttributeValues: Record<string, any> = {}
    const expressionAttributeNames: Record<string, any> = {}

    // Build partition key condition
    const pkName = `#${partitionKeyCondition.attributeName}`
    const pkValue = `:${partitionKeyCondition.attributeName}`
    expressionAttributeNames[pkName] = partitionKeyCondition.attributeName
    expressionAttributeValues[pkValue] = partitionKeyCondition.attributeValue

    let keyConditionExpression = `${pkName} ${partitionKeyCondition.operator} ${pkValue}`

    // Add sort key condition if provided
    if (sortKeyCondition != null) {
      const skName = `#${sortKeyCondition.attributeName}`
      const skValue = `:${sortKeyCondition.attributeName}`
      expressionAttributeNames[skName] = sortKeyCondition.attributeName
      expressionAttributeValues[skValue] = sortKeyCondition.attributeValue

      switch (sortKeyCondition.operator) {
        case QueryConditionOperator.BEGINS_WITH:
          keyConditionExpression += ` AND begins_with(${skName}, ${skValue})`
          break
        case QueryConditionOperator.BETWEEN: {
          const value2 = sortKeyCondition.attributeValue2
          if (value2 != null && value2 !== '') {
            const skValue2 = `:${sortKeyCondition.attributeName}2`
            expressionAttributeValues[skValue2] = value2
            keyConditionExpression += ` AND ${skName} BETWEEN ${skValue} AND ${skValue2}`
          } else {
            throw new DatabaseError(
              'BETWEEN operator requires a non-empty second value',
              GENERIC_CODES.ERROR
            )
          }
          break
        }
        default:
          keyConditionExpression += ` AND ${skName} ${sortKeyCondition.operator} ${skValue}`
      }
    }

    // eslint-disable-next-line no-console
    console.log('keyConditionExpression', 'expressionAttributeValues', 'expressionAttributeNames', keyConditionExpression, expressionAttributeValues, expressionAttributeNames)

    return {
      keyConditionExpression,
      expressionAttributeValues,
      expressionAttributeNames
    }
  }

  async update(item: Dto): Promise<Dto> {
    try {
      const items = this.modelAdapter.fromDto(item)
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
      if (result.Item === null || result.Item === undefined) {
        return null
      }
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
