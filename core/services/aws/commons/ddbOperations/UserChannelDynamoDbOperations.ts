import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { QueryInput } from '../../../../application/models/policies/repositories/QueryTypes'
import { QueryConditionOperator } from '../../../../application/models/policies/repositories/QueryTypes'
import type { UserChannelDTO } from '../../../../../commons/dto/ChatDTO'
import type { UserChannelFields } from '../ddbModels/UserChannelModel'
import UserChannelModel, {
  USER_CHANNEL_PK_PREFIX,
  USER_CHANNEL_SK_PREFIX
} from '../ddbModels/UserChannelModel'
import type UserChannelRepository from '../../../../application/models/policies/repositories/UserChannelRepository'

export default class UserChannelDynamoDbOperations
  extends DynamoDbTableOperations<UserChannelDTO, UserChannelFields, UserChannelModel>
  implements UserChannelRepository {
  constructor(tableName: string, region: string) {
    super(new UserChannelModel(), tableName, region)
  }

  async getUserChannel(userId: string, channelId: string): Promise<UserChannelDTO | null> {
    return super.getItem(
      `${USER_CHANNEL_PK_PREFIX}#${userId}`,
      `${USER_CHANNEL_SK_PREFIX}#${channelId}`
    )
  }

  async getUserChannels(
    userId: string,
    limit?: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: UserChannelDTO[]; lastEvaluatedKey?: Record<string, unknown> }> {
    const query: QueryInput<UserChannelFields> = {
      partitionKeyCondition: {
        attributeName: 'PK',
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${USER_CHANNEL_PK_PREFIX}#${userId}`
      },
      sortKeyCondition: {
        attributeName: 'SK',
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: `${USER_CHANNEL_SK_PREFIX}#`
      },
      options: {
        limit,
        exclusiveStartKey
      }
    }

    return super.query(query as QueryInput<Record<string, unknown>>)
  }
}
