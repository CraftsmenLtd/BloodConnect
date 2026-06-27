import DynamoDbTableOperations from './DynamoDbTableOperations'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import type { QueryInput } from '../../../../application/models/policies/repositories/QueryTypes'
import { QueryConditionOperator } from '../../../../application/models/policies/repositories/QueryTypes'
import type {
  WsConnectionDTO,
  WsConnectionFields
} from '../ddbModels/WsConnectionModel'
import {
  WS_CONNECTION_PK_PREFIX,
  WsConnectionModel
} from '../ddbModels/WsConnectionModel'

const buildClient = (region: string): DynamoDBDocumentClient =>
  DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
    marshallOptions: { removeUndefinedValues: true }
  })

export default class WsConnectionDynamoDbOperations extends DynamoDbTableOperations<
  WsConnectionDTO,
  WsConnectionFields,
  WsConnectionModel
> {
  constructor(tableName: string, region: string) {
    super(new WsConnectionModel(), tableName, region, buildClient(region))
  }

  async putConnection(connection: WsConnectionDTO): Promise<WsConnectionDTO> {
    return super.create(connection)
  }

  async deleteConnection(userId: string, connectionId: string): Promise<void> {
    await super.delete(`${WS_CONNECTION_PK_PREFIX}#${userId}`, connectionId)
  }

  async getConnectionsForUser(userId: string): Promise<WsConnectionDTO[]> {
    const query: QueryInput<WsConnectionFields> = {
      partitionKeyCondition: {
        attributeName: 'PK',
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${WS_CONNECTION_PK_PREFIX}#${userId}`
      }
    }
    const result = await super.query(query as QueryInput<Record<string, unknown>>)

    return result.items
  }
}
