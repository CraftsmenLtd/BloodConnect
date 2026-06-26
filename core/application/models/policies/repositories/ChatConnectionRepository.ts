import type { ChatConnectionDTO } from '../../../../../commons/dto/ChatDTO'
import type Repository from './Repository'

type ChatConnectionRepository = {
  getConnectionsByUser(userId: string): Promise<ChatConnectionDTO[]>;
} & Repository<ChatConnectionDTO>
export default ChatConnectionRepository
