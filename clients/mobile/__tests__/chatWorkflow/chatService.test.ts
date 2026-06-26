import { fetchChatInbox, fetchChatHistory } from '../../src/chatWorkflow/services/chatService'

const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn()
}

describe('chatService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchChatInbox', () => {
    it('returns the channels from the response', async() => {
      const channels = [
        { userId: 'u1', channelId: 'c1', unreadCount: 1, updatedAt: 'now' }
      ]
      mockHttpClient.get.mockResolvedValueOnce({ data: { channels } })

      const result = await fetchChatInbox(mockHttpClient)

      expect(mockHttpClient.get).toHaveBeenCalledWith('/chat/inbox', undefined)
      expect(result.channels).toEqual(channels)
    })

    it('defaults to an empty list when data is missing', async() => {
      mockHttpClient.get.mockResolvedValueOnce({})

      const result = await fetchChatInbox(mockHttpClient)

      expect(result).toEqual({ channels: [] })
    })

    it('throws on failure', async() => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network Error'))

      await expect(fetchChatInbox(mockHttpClient)).rejects.toThrow('Network Error')
    })
  })

  describe('fetchChatHistory', () => {
    it('requests the channel messages endpoint', async() => {
      const messages = [
        { channelId: 'c1', messageId: 'm1', senderId: 'u1', content: 'hi', createdAt: 'now' }
      ]
      mockHttpClient.get.mockResolvedValueOnce({ data: { messages } })

      const result = await fetchChatHistory(mockHttpClient, 'c1', { limit: 50 })

      expect(mockHttpClient.get).toHaveBeenCalledWith('/chat/c1/messages', { limit: 50 })
      expect(result.messages).toEqual(messages)
    })

    it('throws on failure', async() => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Boom'))

      await expect(fetchChatHistory(mockHttpClient, 'c1')).rejects.toThrow('Boom')
    })
  })
})
