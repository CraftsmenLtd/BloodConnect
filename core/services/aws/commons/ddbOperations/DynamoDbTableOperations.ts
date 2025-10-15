import type {
  DbModelDtoAdapter,
  NosqlModel
} from '../ddbModels/DbModelDefinitions'
import type Repository from '../../../../application/models/policies/repositories/Repository'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import type {
  UpdateCommandInput,
  GetCommandInput,
  QueryCommandInput,
  DeleteCommandInput
} from '@aws-sdk/lib-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'
import type {
  QueryInput,
  QueryCondition
} from '../../../../application/models/policies/repositories/QueryTypes'
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import type { DTO } from '../../../../../commons/dto/DTOCommon'
import { GENERIC_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import DatabaseError from '../../../../../commons/libs/errors/DatabaseError'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'
import { isNullOrUndefined } from '../../../../../commons/libs/nullOrUndefined'

type CreateUpdateExpressionsReturnType = {
  updateExpression: string[];
  removeExpression: string[];
  expressionAttribute: Record<string, unknown>;
  expressionAttributeNames: Record<string, string>;
}

export default class DynamoDbTableOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> implements Repository<Dto, DbFields> {
  constructor(
    protected readonly modelAdapter: ModelAdapter,
    protected readonly tableName: string,
    protected readonly region: string,
    private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }))
  ) {}

  async create(item: Dto): Promise<Dto> {
    const items = this.modelAdapter.fromDto(item)
    const command = new PutCommand({
      TableName: this.tableName,
      Item: items
    })
    const putCommandOutput = await this.client.send(command)
    if (putCommandOutput?.$metadata?.httpStatusCode === 200) {
      return this.modelAdapter.toDto(items)
    }
    throw new Error('Failed to create item in DynamoDB')
  }

  async query(
    queryInput: QueryInput<DbFields>,
    indexName?: string,
    requestedAttributes?: string[]
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
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames
      }

      if (indexName !== null) {
        queryCommandInput.IndexName = indexName
      }

      if (!isNullOrUndefined(requestedAttributes) && requestedAttributes.length > 0) {
        queryCommandInput.ProjectionExpression = requestedAttributes.join(', ')
      }

      this.applyQueryOptions(queryCommandInput, queryInput.options)

      const result = await this.client.send(new QueryCommand(queryCommandInput))

      return {
        items: (result.Items ?? []).map((item) =>
          this.modelAdapter.toDto(item as DbFields)
        ),
        lastEvaluatedKey: result.LastEvaluatedKey
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to query items from DynamoDB: ${error instanceof Error
          ? error.message : 'Unknown error'
        }`,
        GENERIC_CODES.ERROR
      )
    }
  }

  private applyQueryOptions(
    queryCommandInput: QueryCommandInput,
    options?: QueryInput<DbFields>['options']
  ): void {
    if (isNullOrUndefined(options)) return

    const {
      indexName,
      limit,
      scanIndexForward,
      exclusiveStartKey,
      filterExpression,
      filterExpressionValues
    } = options

    if (!isNullOrUndefined(indexName)) {
      queryCommandInput.IndexName = indexName
    }
    if (!isNullOrUndefined(limit) && limit > 0) {
      queryCommandInput.Limit = limit
    }
    if (scanIndexForward !== undefined) {
      queryCommandInput.ScanIndexForward = scanIndexForward
    }
    if (
      !isNullOrUndefined(exclusiveStartKey)
      && Object.keys(exclusiveStartKey).length > 0
    ) {
      queryCommandInput.ExclusiveStartKey = exclusiveStartKey
    }
    if (!isNullOrUndefined(filterExpression)) {
      queryCommandInput.FilterExpression = filterExpression
      if (
        !isNullOrUndefined(filterExpressionValues)
        && Object.keys(filterExpressionValues).length > 0
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

    expressionAttributeNames[`#${String(sortKeyCondition.attributeName)}`]
      = String(sortKeyCondition.attributeName)
    expressionAttributeValues[`:${String(sortKeyCondition.attributeName)}`]
      = sortKeyCondition.attributeValue

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
        removeExpression,
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
        TableName: this.tableName,
        Key: keyObject,
        UpdateExpression: `${updateExpression.length
          ? `SET ${updateExpression.join(', ')}` : ''}${removeExpression.length
          ? `REMOVE ${removeExpression.join(', ')}` : ''}`,
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
        'Failed to update item in DynamoDB. HTTP Status Code: '
        + updateCommandOutput.$metadata?.httpStatusCode
      )
    } catch (error) {
      const errorMessage
        = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
      throw new Error(
        `Failed to update item in ${this.tableName}. Error: ${errorMessage}`
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
        TableName: this.tableName,
        Key: key
      }

      const result = await this.client.send(new GetCommand(input))
      if (result.Item === null || result.Item === undefined) {
        return null
      }

      return this.modelAdapter.toDto(result.Item as DbFields)
    } catch (_error) {
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
        TableName: this.tableName,
        Key: key
      }

      await this.client.send(new DeleteCommand(input))
    } catch (error) {
      const errorMessage
        = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
      throw new Error(
        `Failed to delete item in ${this.tableName}. Error: ${errorMessage}`
      )
    }
  }

  private createUpdateExpressions(
    item: Record<string, unknown>
  ): CreateUpdateExpressionsReturnType {
    const updateExpression: string[] = []
    const removeExpression: string[] = []
    const expressionAttribute: Record<string, unknown> = {}
    const expressionAttributeNames: Record<string, string> = {}
    for (const key in item) {
      const value = item[key]
      const placeholder = `:p${key}`
      const alias = `#a${key}`
      expressionAttributeNames[alias] = key

      if (value === null) {
        removeExpression.push(alias)
      } else {
        updateExpression.push(`${alias} = ${placeholder}`)
        expressionAttribute[placeholder] = value
      }
    }

    return { updateExpression, expressionAttribute, expressionAttributeNames, removeExpression }
  }

  private removePrimaryKey(
    partitionKeyName: string,
    item: Record<string, unknown>,
    sortKeyName?: string
  ): Record<string, unknown> {
    const { [partitionKeyName]: _, ...rest } = { ...item }
    if (
      sortKeyName !== null
      && sortKeyName !== ''
      && sortKeyName !== undefined
    ) {
      const { [sortKeyName]: _, ...itemWithoutPrimaryKey } = rest

      return itemWithoutPrimaryKey
    }

    return rest
  }
}
