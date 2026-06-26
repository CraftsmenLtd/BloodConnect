import type { UserChannelDTO } from '../../../../../commons/dto/ChatDTO'
import type Repository from './Repository'

type UserChannelRepository = {
  getUserChannel(userId: string, channelId: string): Promise<UserChannelDTO | null>;
  getUserChannels(
    userId: string,
    limit?: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: UserChannelDTO[]; lastEvaluatedKey?: Record<string, unknown> }>;
} & Repository<UserChannelDTO>
export default UserChannelRepository
