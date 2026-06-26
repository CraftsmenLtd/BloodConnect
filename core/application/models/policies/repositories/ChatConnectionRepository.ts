import type { ChatConnectionDTO } from 'commons/dto/ChatDTO'

// Live WebSocket connections, keyed by connectionId; queryByUserId fans a message out to
// all of a recipient's open connections.
type ChatConnectionRepository = {
  put(connection: ChatConnectionDTO): Promise<ChatConnectionDTO>;
  deleteByConnectionId(connectionId: string): Promise<void>;
  queryByUserId(userId: string): Promise<ChatConnectionDTO[]>;
}
export default ChatConnectionRepository
