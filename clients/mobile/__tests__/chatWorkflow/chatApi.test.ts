import { buildQuery, fetchHistory, fetchChannels } from '../../src/chatWorkflow/chatApi'
import type { ChatApiClient } from '../../src/chatWorkflow/chatApi'

describe('chatApi', () => {
  describe('buildQuery', () => {
    it('omits undefined and empty params', () => {
      expect(buildQuery({ channelId: 'c#d', cursor: undefined, limit: '' })).toBe('?channelId=c%23d')
    })

    it('returns empty string when nothing to encode', () => {
      expect(buildQuery({ cursor: undefined })).toBe('')
    })
  })

  it('fetchHistory requests the history path and returns data', async () => {
    const client: ChatApiClient = {
      get: jest.fn().mockResolvedValue({ data: { items: [], nextCursor: null } })
    }
    const page = await fetchHistory(client, 'req-1#donor-1', 'cur')
    expect(client.get).toHaveBeenCalledWith('/chat/history?channelId=req-1%23donor-1&cursor=cur')
    expect(page).toEqual({ items: [], nextCursor: null })
  })

  it('fetchChannels requests the channels path', async () => {
    const client: ChatApiClient = {
      get: jest.fn().mockResolvedValue({ data: { items: [], nextCursor: null } })
    }
    await fetchChannels(client)
    expect(client.get).toHaveBeenCalledWith('/chat/channels')
  })
})
