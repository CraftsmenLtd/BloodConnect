import { fetchChatHistory, markChannelRead, sendChatMessageRest } from '../../src/chat/services/chatService'
import { FetchClientError } from '../../src/setup/clients/FetchClientError'
import type { ChatMessageDTO } from '../../../../commons/dto/ChatDTO'

const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn()
}

const sampleMessage: ChatMessageDTO = {
  channelId: 'ch1',
  messageId: 'm1',
  senderId: 'donor-1',
  text: 'hello',
  createdAt: '2026-06-26T10:00:00.000Z',
  expiresAt: 1_900_000_000
}

describe('chatService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchChatHistory', () => {
    it('queries the channel messages endpoint and returns history', async() => {
      mockHttpClient.get.mockResolvedValueOnce({ messages: [sampleMessage], status: 200 })

      const result = await fetchChatHistory({ channelId: 'ch1', limit: 20 }, mockHttpClient)

      expect(mockHttpClient.get).toHaveBeenCalledWith('/chat/ch1/messages', { limit: 20 })
      expect(result).toEqual({ messages: [sampleMessage], lastEvaluatedKey: undefined })
    })

    it('encodes the pagination cursor as a JSON string', async() => {
      mockHttpClient.get.mockResolvedValueOnce({ messages: [], lastEvaluatedKey: { sk: 'x' }, status: 200 })

      const result = await fetchChatHistory(
        { channelId: 'ch1', limit: 30, lastEvaluatedKey: { sk: 'prev' } },
        mockHttpClient
      )

      expect(mockHttpClient.get).toHaveBeenCalledWith('/chat/ch1/messages', { limit: 30, cursor: '{"sk":"prev"}' })
      expect(result.lastEvaluatedKey).toEqual({ sk: 'x' })
    })

    it('throws on failure', async() => {
      mockHttpClient.get.mockRejectedValueOnce(new FetchClientError('History Error', 500))

      await expect(fetchChatHistory({ channelId: 'ch1' }, mockHttpClient)).rejects.toThrow('History Error')
    })
  })

  describe('markChannelRead', () => {
    it('posts to the read endpoint with an empty body', async() => {
      mockHttpClient.post.mockResolvedValueOnce({ success: true, status: 200 })

      const result = await markChannelRead('ch1', mockHttpClient)

      expect(mockHttpClient.post).toHaveBeenCalledWith('/chat/ch1/read', {})
      expect(result).toEqual({ message: undefined, success: true, status: 200 })
    })

    it('throws on failure', async() => {
      mockHttpClient.post.mockRejectedValueOnce(new FetchClientError('Read Error', 400))

      await expect(markChannelRead('ch1', mockHttpClient)).rejects.toThrow('Read Error')
    })
  })

  describe('sendChatMessageRest', () => {
    it('posts the client-supplied id, text and timestamp', async() => {
      mockHttpClient.post.mockResolvedValueOnce({ data: sampleMessage, status: 201 })

      const result = await sendChatMessageRest(
        { channelId: 'ch1', messageId: 'm1', text: 'hello', createdAt: '2026-06-26T10:00:00.000Z' },
        mockHttpClient
      )

      expect(mockHttpClient.post).toHaveBeenCalledWith('/chat/ch1/messages', {
        messageId: 'm1',
        text: 'hello',
        createdAt: '2026-06-26T10:00:00.000Z'
      })
      expect(result).toEqual({ data: sampleMessage, status: 201 })
    })

    it('throws on failure', async() => {
      mockHttpClient.post.mockRejectedValueOnce(new FetchClientError('Send Error', 500))

      await expect(sendChatMessageRest(
        { channelId: 'ch1', messageId: 'm1', text: 'hello', createdAt: '2026-06-26T10:00:00.000Z' },
        mockHttpClient
      )).rejects.toThrow('Send Error')
    })
  })
})
