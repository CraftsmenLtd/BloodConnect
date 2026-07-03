import DynamoDbTableOperations from './DynamoDbTableOperations'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import type { ChatConnectionFields } from '../ddbModels/ChatConnectionModel'
import {
  ChatConnectionModel,
  CHAT_CONN_PK_PREFIX,
  CHAT_CONN_SK,
  CHAT_CONN_USER_GSI1PK_PREFIX
} from '../ddbModels/ChatConnectionModel'
import type { ChatConnectionDTO } from '../../../../../commons/dto/ChatDTO'
import type ChatConnectionRepository from '../../../../application/models/policies/repositories/ChatConnectionRepository'

export default class ChatConnectionDynamoDbOperations
  extends DynamoDbTableOperations<ChatConnectionDTO, ChatConnectionFields, ChatConnectionModel>
  implements ChatConnectionRepository {
  constructor(tableName: string, region: string) {
    super(new ChatConnectionModel(), tableName, region)
  }

  async saveConnection(connection: ChatConnectionDTO): Promise<void> {
    await super.create(connection)
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await super.delete(`${CHAT_CONN_PK_PREFIX}#${connectionId}`, CHAT_CONN_SK)
  }

  async getConnection(connectionId: string): Promise<ChatConnectionDTO | null> {
    return super.getItem(`${CHAT_CONN_PK_PREFIX}#${connectionId}`, CHAT_CONN_SK)
  }

  async queryConnectionsByUser(userId: string): Promise<ChatConnectionDTO[]> {
    const query: QueryInput<ChatConnectionFields> = {
      partitionKeyCondition: {
        attributeName: 'GSI1PK',
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${CHAT_CONN_USER_GSI1PK_PREFIX}#${userId}`
      }
    }
    const result = await super.query(query as QueryInput<Record<string, unknown>>, 'GSI1')

    return result.items
  }
}
