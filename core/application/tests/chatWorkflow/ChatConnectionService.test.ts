import { ChatConnectionService } from '../../chatWorkflow/ChatConnectionService'
import { mockLogger } from '../mocks/mockLogger'

describe('ChatConnectionService', () => {
  const chatConnectionRepository = {
    create: jest.fn(),
    update: jest.fn(),
    getItem: jest.fn(),
    query: jest.fn(),
    delete: jest.fn(),
    getConnectionsByUser: jest.fn(),
    deleteConnection: jest.fn()
  }

  const service = new ChatConnectionService(chatConnectionRepository, mockLogger)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('registers a connection with a user and TTL', async () => {
    chatConnectionRepository.create.mockImplementation(async (item) => item)

    const result = await service.registerConnection({
      connectionId: 'conn-1',
      userId: 'user-1'
    })

    expect(result.connectionId).toBe('conn-1')
    expect(result.userId).toBe('user-1')
    expect(typeof result.expiresAt).toBe('number')
    expect(chatConnectionRepository.create).toHaveBeenCalledTimes(1)
  })

  it('removes a connection via the prefixed-key delete', async () => {
    chatConnectionRepository.deleteConnection.mockResolvedValue(undefined)

    await service.removeConnection('conn-1')

    expect(chatConnectionRepository.deleteConnection).toHaveBeenCalledWith('conn-1')
  })

  it('swallows delete errors so disconnect never fails', async () => {
    chatConnectionRepository.deleteConnection.mockRejectedValue(new Error('boom'))

    await expect(service.removeConnection('conn-1')).resolves.toBeUndefined()
  })

  it('returns the connections for a user', async () => {
    const connections = [{ connectionId: 'conn-1', userId: 'user-1' }]
    chatConnectionRepository.getConnectionsByUser.mockResolvedValue(connections)

    const result = await service.getUserConnections('user-1')

    expect(result).toEqual(connections)
  })
})
