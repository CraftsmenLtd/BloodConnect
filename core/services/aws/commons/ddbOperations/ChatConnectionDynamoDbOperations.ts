import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { QueryInput } from '../../../../application/models/policies/repositories/QueryTypes'
import { QueryConditionOperator } from '../../../../application/models/policies/repositories/QueryTypes'
import type { ChatConnectionDTO } from '../../../../../commons/dto/ChatDTO'
import type { ChatConnectionFields } from '../ddbModels/ChatConnectionModel'
import ChatConnectionModel, {
  CONNECTION_PK_PREFIX,
  CONNECTION_META_SK,
  CONNECTION_USER_GSI,
  CONNECTION_USER_PREFIX
} from '../ddbModels/ChatConnectionModel'
import type ChatConnectionRepository from '../../../../application/models/policies/repositories/ChatConnectionRepository'

export default class ChatConnectionDynamoDbOperations
  extends DynamoDbTableOperations<ChatConnectionDTO, ChatConnectionFields, ChatConnectionModel>
  implements ChatConnectionRepository {
  constructor(tableName: string, region: string) {
    super(new ChatConnectionModel(), tableName, region)
  }

  async getConnectionsByUser(userId: string): Promise<ChatConnectionDTO[]> {
    const query: QueryInput<ChatConnectionFields> = {
      partitionKeyCondition: {
        attributeName: 'GSI1PK',
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${CONNECTION_USER_PREFIX}#${userId}`
      },
      sortKeyCondition: {
        attributeName: 'GSI1SK',
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: `${CONNECTION_PK_PREFIX}#`
      },
      options: { indexName: CONNECTION_USER_GSI }
    }
    const result = await super.query(
      query as QueryInput<Record<string, unknown>>,
      CONNECTION_USER_GSI
    )

    return result.items
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await super.delete(`${CONNECTION_PK_PREFIX}#${connectionId}`, CONNECTION_META_SK)
  }
}
