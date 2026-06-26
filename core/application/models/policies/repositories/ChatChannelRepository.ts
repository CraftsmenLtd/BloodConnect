import type { ChatChannelDTO } from '../../../../../commons/dto/ChatDTO'
import type Repository from './Repository'

type ChatChannelRepository = {
  getChannel(channelId: string): Promise<ChatChannelDTO | null>;
} & Repository<ChatChannelDTO>
export default ChatChannelRepository
