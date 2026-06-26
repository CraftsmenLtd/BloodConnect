import type { ChatConnectionDTO } from '../../../../../commons/dto/ChatDTO'
import type Repository from './Repository'

type ChatConnectionRepository = {
  getConnectionsByUser(userId: string): Promise<ChatConnectionDTO[]>;
  deleteConnection(connectionId: string): Promise<void>;
} & Repository<ChatConnectionDTO>
export default ChatConnectionRepository
