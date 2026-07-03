import type { ChatConnectionDTO } from 'commons/dto/ChatDTO'

type ChatConnectionRepository = {
  saveConnection(connection: ChatConnectionDTO): Promise<void>;
  deleteConnection(connectionId: string): Promise<void>;
  queryConnectionsByUser(userId: string): Promise<ChatConnectionDTO[]>;
  getConnection(connectionId: string): Promise<ChatConnectionDTO | null>;
}
export default ChatConnectionRepository
