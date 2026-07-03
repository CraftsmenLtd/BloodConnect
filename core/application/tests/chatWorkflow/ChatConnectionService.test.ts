import { ChatConnectionService } from '../../chatWorkflow/ChatConnectionService'
import type ChatConnectionRepository from '../../models/policies/repositories/ChatConnectionRepository'
import type { ChatConnectionDTO } from '../../../../commons/dto/ChatDTO'
import ChatOperationError from '../../chatWorkflow/ChatOperationError'
import { mockLogger } from '../mocks/mockLogger'

const buildRepository = (): jest.Mocked<ChatConnectionRepository> => ({
  saveConnection: jest.fn(),
  deleteConnection: jest.fn(),
  queryConnectionsByUser: jest.fn(),
  getConnection: jest.fn()
})

const connection = (connectionId: string, userId: string): ChatConnectionDTO => ({
  connectionId,
  userId,
  connectedAt: '2026-06-26T00:00:00.000Z',
  ttl: 1893456000
})

describe('ChatConnectionService', () => {
  let repository: jest.Mocked<ChatConnectionRepository>
  let service: ChatConnectionService

  beforeEach(() => {
    repository = buildRepository()
    service = new ChatConnectionService(repository, mockLogger)
  })

  it('registers a connection with a TTL', async () => {
    await service.registerConnection('conn-1', 'user-1')
    const saved = repository.saveConnection.mock.calls[0][0]
    expect(saved.connectionId).toBe('conn-1')
    expect(saved.userId).toBe('user-1')
    expect(saved.ttl).toBeGreaterThan(0)
  })

  it('rejects invalid identifiers on register', async () => {
    await expect(service.registerConnection('conn 1', 'user-1')).rejects.toBeInstanceOf(
      ChatOperationError
    )
  })

  it('removes a connection by id', async () => {
    await service.removeConnection('conn-1')
    expect(repository.deleteConnection).toHaveBeenCalledWith('conn-1')
  })

  it('lists connection ids for a user', async () => {
    repository.queryConnectionsByUser.mockResolvedValue([
      connection('conn-1', 'user-1'),
      connection('conn-2', 'user-1')
    ])
    expect(await service.getConnectionsForUser('user-1')).toEqual(['conn-1', 'conn-2'])
  })

  it('reports connectivity', async () => {
    repository.queryConnectionsByUser.mockResolvedValueOnce([connection('conn-1', 'user-1')])
    expect(await service.isUserConnected('user-1')).toBe(true)
    repository.queryConnectionsByUser.mockResolvedValueOnce([])
    expect(await service.isUserConnected('user-2')).toBe(false)
  })
})
