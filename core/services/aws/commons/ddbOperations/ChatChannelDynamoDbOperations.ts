import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { ChatChannelDTO } from '../../../../../commons/dto/ChatDTO'
import type { ChatChannelFields } from '../ddbModels/ChatChannelModel'
import ChatChannelModel, {
  CHANNEL_PK_PREFIX,
  CHANNEL_META_SK
} from '../ddbModels/ChatChannelModel'
import type ChatChannelRepository from '../../../../application/models/policies/repositories/ChatChannelRepository'

export default class ChatChannelDynamoDbOperations
  extends DynamoDbTableOperations<ChatChannelDTO, ChatChannelFields, ChatChannelModel>
  implements ChatChannelRepository {
  constructor(tableName: string, region: string) {
    super(new ChatChannelModel(), tableName, region)
  }

  async getChannel(channelId: string): Promise<ChatChannelDTO | null> {
    return super.getItem(`${CHANNEL_PK_PREFIX}#${channelId}`, CHANNEL_META_SK)
  }
}
