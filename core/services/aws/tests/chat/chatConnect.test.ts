import chatConnect from '../../chat/chatConnect'
import chatDisconnect from '../../chat/chatDisconnect'
import { ChatConnectionService } from '../../../../application/chatWorkflow/ChatConnectionService'
import type { ChatWsEvent } from '../../chat/websocketTypes'

jest.mock('../../../../application/chatWorkflow/ChatConnectionService')
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() })
}))

const mockService = ChatConnectionService as jest.MockedClass<typeof ChatConnectionService>

const event = (requestContext: ChatWsEvent['requestContext']): ChatWsEvent => ({ requestContext })

describe('chatConnect / chatDisconnect handlers', () => {
  afterEach(() => jest.clearAllMocks())

  it('registers a connection with the authorizer userId', async () => {
    const result = await chatConnect(event({ connectionId: 'c1', authorizer: { userId: 'u1' } }))
    expect(mockService.prototype.registerConnection).toHaveBeenCalledWith('c1', 'u1')
    expect(result.statusCode).toBe(200)
  })

  it('returns 401 when the authorizer did not supply a userId', async () => {
    const result = await chatConnect(event({ connectionId: 'c1' }))
    expect(mockService.prototype.registerConnection).not.toHaveBeenCalled()
    expect(result.statusCode).toBe(401)
  })

  it('removes the connection on disconnect', async () => {
    const result = await chatDisconnect(event({ connectionId: 'c1' }))
    expect(mockService.prototype.removeConnection).toHaveBeenCalledWith('c1')
    expect(result.statusCode).toBe(200)
  })
})
