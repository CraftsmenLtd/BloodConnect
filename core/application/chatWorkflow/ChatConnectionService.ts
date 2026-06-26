import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import ChatOperationError from './ChatOperationError'
import { calculateConnectionExpiry } from '../utils/chatChannel'
import type { RegisterConnectionAttributes } from './Types'
import type { ChatConnectionDTO } from '../../../commons/dto/ChatDTO'
import type ChatConnectionRepository from '../models/policies/repositories/ChatConnectionRepository'
import type { Logger } from '../models/logger/Logger'

export class ChatConnectionService {
  constructor(
    protected readonly chatConnectionRepository: ChatConnectionRepository,
    protected readonly logger: Logger
  ) {}

  async registerConnection(
    attributes: RegisterConnectionAttributes
  ): Promise<ChatConnectionDTO> {
    const connection: ChatConnectionDTO = {
      connectionId: attributes.connectionId,
      userId: attributes.userId,
      connectedAt: new Date().toISOString(),
      expiresAt: calculateConnectionExpiry()
    }

    return this.chatConnectionRepository.create(connection).catch((error) => {
      throw new ChatOperationError(
        `Failed to register connection: ${this.getErrorMessage(error)}`,
        GENERIC_CODES.ERROR
      )
    })
  }

  async removeConnection(connectionId: string): Promise<void> {
    await this.chatConnectionRepository.deleteConnection(connectionId).catch((error) => {
      this.logger.warn(`Failed to remove connection ${connectionId}: ${this.getErrorMessage(error)}`)
    })
  }

  async getUserConnections(userId: string): Promise<ChatConnectionDTO[]> {
    return this.chatConnectionRepository.getConnectionsByUser(userId)
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error'
  }
}
