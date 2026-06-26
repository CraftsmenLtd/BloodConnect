import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { QueryInput } from '../../../../application/models/policies/repositories/QueryTypes'
import { QueryConditionOperator } from '../../../../application/models/policies/repositories/QueryTypes'
import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import type { ChatMessageFields } from '../ddbModels/ChatMessageModel'
import ChatMessageModel, { MESSAGE_SK_PREFIX } from '../ddbModels/ChatMessageModel'
import { CHANNEL_PK_PREFIX } from '../ddbModels/ChatChannelModel'
import type ChatMessageRepository from '../../../../application/models/policies/repositories/ChatMessageRepository'

export default class ChatMessageDynamoDbOperations
  extends DynamoDbTableOperations<ChatMessageDTO, ChatMessageFields, ChatMessageModel>
  implements ChatMessageRepository {
  constructor(tableName: string, region: string) {
    super(new ChatMessageModel(), tableName, region)
  }

  async getChannelMessages(
    channelId: string,
    limit?: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: ChatMessageDTO[]; lastEvaluatedKey?: Record<string, unknown> }> {
    const query: QueryInput<ChatMessageFields> = {
      partitionKeyCondition: {
        attributeName: 'PK',
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${CHANNEL_PK_PREFIX}#${channelId}`
      },
      sortKeyCondition: {
        attributeName: 'SK',
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: `${MESSAGE_SK_PREFIX}#`
      },
      options: {
        limit,
        scanIndexForward: false,
        exclusiveStartKey
      }
    }

    return super.query(query as QueryInput<Record<string, unknown>>)
  }
}
