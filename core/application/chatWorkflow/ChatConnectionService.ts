import type ChatConnectionRepository from '../models/policies/repositories/ChatConnectionRepository'
import type { Logger } from '../models/logger/Logger'
import type { ChatConnectionDTO } from '../../../commons/dto/ChatDTO'
import { CONNECTION_TTL_SECONDS, ttlFromNow } from './Types'
import { validateIds } from './validation'
import { chatForbidden } from './ChatOperationError'

export class ChatConnectionService {
  constructor(
    protected readonly chatConnectionRepository: ChatConnectionRepository,
    protected readonly logger: Logger
  ) {}

  async registerConnection(connectionId: string, userId: string): Promise<void> {
    validateIds({ connectionId, userId })
    const nowMs = Date.now()
    const connection: ChatConnectionDTO = {
      connectionId,
      userId,
      connectedAt: new Date(nowMs).toISOString(),
      ttl: ttlFromNow(nowMs, CONNECTION_TTL_SECONDS)
    }
    await this.chatConnectionRepository.saveConnection(connection)
    this.logger.info('chat connection registered', { userId })
  }

  async removeConnection(connectionId: string): Promise<void> {
    await this.chatConnectionRepository.deleteConnection(connectionId)
  }

  async getConnectionsForUser(userId: string): Promise<string[]> {
    const connections = await this.chatConnectionRepository.queryConnectionsByUser(userId)

    return connections.map((connection) => connection.connectionId)
  }

  async isUserConnected(userId: string): Promise<boolean> {
    const connections = await this.chatConnectionRepository.queryConnectionsByUser(userId)

    return connections.length > 0
  }

  async getConnectionUser(connectionId: string): Promise<string> {
    const connection = await this.chatConnectionRepository.getConnection(connectionId)
    if (connection === null) {
      throw chatForbidden('Unknown connection')
    }

    return connection.userId
  }
}
