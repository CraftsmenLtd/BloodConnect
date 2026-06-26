import type { ChatConnectionDTO } from 'commons/dto/ChatDTO'

// Live WebSocket connections, keyed by connectionId; queryByUserId fans a message out to
// all of a recipient's open connections.
type ChatConnectionRepository = {
  put(connection: ChatConnectionDTO): Promise<ChatConnectionDTO>;
  deleteByConnectionId(connectionId: string): Promise<void>;
  queryByUserId(userId: string): Promise<ChatConnectionDTO[]>;
  // Resolves the authenticated userId for a live connection: the $connect authorizer context is
  // not propagated to message routes, so sendMessage looks the sender up by connectionId.
  getByConnectionId(connectionId: string): Promise<ChatConnectionDTO | null>;
}
export default ChatConnectionRepository
