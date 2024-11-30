import {
  DbModelDtoAdapter,
  NosqlModel
} from '../../../../application/models/dbModels/DbModelDefinitions'
import Repository from '../../../../application/models/policies/repositories/Repository'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommandInput,
  UpdateCommand,
  GetCommandInput,
  GetCommand,
  QueryCommand,
  QueryCommandInput,
  DeleteCommandInput,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'
import {
  QueryInput,
  QueryCondition,
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
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
> implements Repository<Dto, DbFields> {
  constructor(
    private readonly modelAdapter: ModelAdapter,
    private readonly client = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION })
    )
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
    throw new Error(
      'Failed to create item in DynamoDB. property "putCommandOutput.Attributes" is undefined'
    )
  }

  async query(
    queryInput: QueryInput<DbFields>,
    indexName?: string
  ): Promise<{ items: Dto[]; lastEvaluatedKey?: Record<string, unknown> }> {
    try {
      const {
        keyConditionExpression,
        expressionAttributeValues,
        expressionAttributeNames
      } = this.buildKeyConditionExpression(
        queryInput.partitionKeyCondition,
        queryInput.sortKeyCondition
      )

      const queryCommandInput: QueryCommandInput = {
        TableName: this.getTableName(),
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames
      }

      if (indexName !== null) {
        queryCommandInput.IndexName = indexName
      }

      this.applyQueryOptions(queryCommandInput, queryInput.options)

      const result = await this.client.send(
        new QueryCommand(queryCommandInput)
      )

      return {
        items: (result.Items ?? []).map((item) =>
          this.modelAdapter.toDto(item as DbFields)
        ),
        lastEvaluatedKey: result.LastEvaluatedKey
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to query items from DynamoDB: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        GENERIC_CODES.ERROR
      )
    }
  }

  private applyQueryOptions(
    queryCommandInput: QueryCommandInput,
    options?: QueryInput<DbFields>['options']
  ): void {
    if (options == null) return

    const {
      indexName,
      limit,
      scanIndexForward,
      exclusiveStartKey,
      filterExpression,
      filterExpressionValues
    } = options

    if (indexName?.trim() != null) {
      queryCommandInput.IndexName = indexName
    }
    if (limit != null && limit > 0) {
      queryCommandInput.Limit = limit
    }
    if (scanIndexForward !== undefined) {
      queryCommandInput.ScanIndexForward = scanIndexForward
    }
    if (
      exclusiveStartKey != null &&
      Object.keys(exclusiveStartKey).length > 0
    ) {
      queryCommandInput.ExclusiveStartKey = exclusiveStartKey
    }
    if (filterExpression?.trim() != null) {
      queryCommandInput.FilterExpression = filterExpression
      if (
        filterExpressionValues != null &&
        Object.keys(filterExpressionValues).length > 0
      ) {
        queryCommandInput.ExpressionAttributeValues = {
          ...queryCommandInput.ExpressionAttributeValues,
          ...filterExpressionValues
        }
      }
    }
  }

  private buildKeyConditionExpression(
    partitionKeyCondition: QueryCondition<DbFields>,
    sortKeyCondition?: QueryCondition<DbFields>
  ): {
      keyConditionExpression: string;
      expressionAttributeValues: Record<string, unknown>;
      expressionAttributeNames: Record<string, string>;
    } {
    const expressionAttributeValues: Record<string, unknown> = {
      [`:${String(partitionKeyCondition.attributeName)}`]:
        partitionKeyCondition.attributeValue
    }
    const expressionAttributeNames: Record<string, string> = {
      [`#${String(partitionKeyCondition.attributeName)}`]: String(
        partitionKeyCondition.attributeName
      )
    }

    const baseKeyConditionExpression = `#${String(
      partitionKeyCondition.attributeName
    )} ${partitionKeyCondition.operator} :${String(
      partitionKeyCondition.attributeName
    )}`

    if (sortKeyCondition === undefined || sortKeyCondition === null) {
      return {
        keyConditionExpression: baseKeyConditionExpression,
        expressionAttributeValues,
        expressionAttributeNames
      }
    }

    expressionAttributeNames[`#${String(sortKeyCondition.attributeName)}`] =
      String(sortKeyCondition.attributeName)
    expressionAttributeValues[`:${String(sortKeyCondition.attributeName)}`] =
      sortKeyCondition.attributeValue

    switch (sortKeyCondition.operator) {
      case QueryConditionOperator.BEGINS_WITH:
        return {
          keyConditionExpression: `${baseKeyConditionExpression} AND begins_with(#${String(
            sortKeyCondition.attributeName
          )}, :${String(sortKeyCondition.attributeName)})`,
          expressionAttributeValues,
          expressionAttributeNames
        }

      case QueryConditionOperator.BETWEEN: {
        const value2 = sortKeyCondition.attributeValue2
        if (value2 === undefined || value2 === null || value2 === '') {
          throw new DatabaseError(
            'BETWEEN operator requires a non-empty second value',
            GENERIC_CODES.ERROR
          )
        }
        expressionAttributeValues[
          `:${String(sortKeyCondition.attributeName)}2`
        ] = value2
        return {
          keyConditionExpression: `${baseKeyConditionExpression} AND #${String(
            sortKeyCondition.attributeName
          )} BETWEEN :${String(sortKeyCondition.attributeName)} AND :${String(
            sortKeyCondition.attributeName
          )}2`,
          expressionAttributeValues,
          expressionAttributeNames
        }
      }

      default:
        return {
          keyConditionExpression: `${baseKeyConditionExpression} AND #${String(
            sortKeyCondition.attributeName
          )} ${sortKeyCondition.operator} :${String(
            sortKeyCondition.attributeName
          )}`,
          expressionAttributeValues,
          expressionAttributeNames
        }
    }
  }

  async update(item: Dto): Promise<Dto> {
    try {
      const items = this.modelAdapter.fromDto(item)
      const primaryKeyName = this.modelAdapter.getPrimaryIndex()
      const updatedItem = this.removePrimaryKey(
        primaryKeyName.partitionKey as string,
        items,
        primaryKeyName.sortKey as string
      )
      const {
        updateExpression,
        expressionAttribute,
        expressionAttributeNames
      } = this.createUpdateExpressions(updatedItem)
      const keyObject: Record<string, DbFields[keyof DbFields]> = {
        [primaryKeyName.partitionKey]: items[primaryKeyName.partitionKey]
      }
      if (typeof primaryKeyName.sortKey === 'string') {
        keyObject[primaryKeyName.sortKey] = items[
          primaryKeyName.sortKey
        ] as DbFields[keyof DbFields]
      }

      const input: UpdateCommandInput = {
        TableName: this.getTableName(),
        Key: keyObject,
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttribute,
        ExpressionAttributeNames: expressionAttributeNames
      }

      const updateCommandOutput = await this.client.send(
        new UpdateCommand(input)
      )

      if (updateCommandOutput?.$metadata?.httpStatusCode === 200) {
        return this.modelAdapter.toDto(items)
      }
      throw new Error(
        'Failed to update item in DynamoDB. HTTP Status Code: ' +
          updateCommandOutput.$metadata?.httpStatusCode
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(
        `Failed to update item in ${this.getTableName()}. Error: ${errorMessage}`
      )
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
      throw new DatabaseError(
        'Failed to fetch item from DynamoDB',
        GENERIC_CODES.ERROR
      )
    }
  }

  async delete(partitionKey: string, sortKey?: string): Promise<void> {
    try {
      const primaryKeyName = this.modelAdapter.getPrimaryIndex()
      const key: Record<string, DbFields[keyof DbFields]> = {
        [primaryKeyName.partitionKey]: partitionKey as DbFields[keyof DbFields]
      }

      if (sortKey !== undefined && typeof primaryKeyName.sortKey === 'string') {
        key[primaryKeyName.sortKey] = sortKey as DbFields[keyof DbFields]
      }

      const input: DeleteCommandInput = {
        TableName: this.getTableName(),
        Key: key
      }

      await this.client.send(new DeleteCommand(input))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(
        `Failed to delete item in ${this.getTableName()}. Error: ${errorMessage}`
      )
    }
  }

  getTableName(): string {
    if (process.env.DYNAMODB_TABLE_NAME == null) {
      throw new DatabaseError(
        'DDB Table name not defined',
        GENERIC_CODES.ERROR
      )
    }
    return process.env.DYNAMODB_TABLE_NAME
  }

  private createUpdateExpressions(
    item: Record<string, unknown>
  ): CreateUpdateExpressionsReturnType {
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

  private removePrimaryKey(
    partitionKeyName: string,
    item: Record<string, unknown>,
    sortKeyName?: string
  ): Record<string, unknown> {
    const { [partitionKeyName]: _, ...rest } = { ...item }
    if (
      sortKeyName != null &&
      sortKeyName !== '' &&
      sortKeyName !== undefined
    ) {
      const { [sortKeyName]: __, ...itemWithoutPrimaryKey } = rest
      return itemWithoutPrimaryKey
    }
    return rest
  }
}
