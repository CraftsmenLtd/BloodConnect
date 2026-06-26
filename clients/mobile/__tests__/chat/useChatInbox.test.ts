import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useChatInbox } from '../../src/chat/useChatInbox'
import { fetchChatChannels, markChatRead } from '../../src/chat/chatService'
import { ChatRole } from '../../../../commons/dto/ChatDTO'

jest.mock('../../src/setup/clients/useFetchClient', () => ({
  useFetchClient: () => ({})
}))

jest.mock('../../src/chat/chatService', () => ({
  fetchChatChannels: jest.fn(),
  markChatRead: jest.fn()
}))

const membership = {
  userId: 'u',
  channelId: 'seeker#req#donor',
  role: ChatRole.DONOR,
  lastMessageAt: '2020-06-26T10:00:00.000Z',
  lastReadAt: '2020-06-26T09:00:00.000Z',
  createdAt: '2020-06-26T08:00:00.000Z'
}

describe('useChatInbox', () => {
  afterEach(() => { jest.clearAllMocks() })

  it('flags a channel unread when lastMessageAt is newer than lastReadAt', async() => {
    (fetchChatChannels as jest.Mock).mockResolvedValue({ data: [membership], status: 200 })

    const { result } = renderHook(() => useChatInbox())

    await waitFor(() => { expect(result.current.channels).toHaveLength(1) })
    expect(result.current.channels[0].unread).toBe(true)
  })

  it('clears the unread indicator after markRead', async() => {
    (fetchChatChannels as jest.Mock).mockResolvedValue({ data: [membership], status: 200 })
    ;(markChatRead as jest.Mock).mockResolvedValue({ success: true, status: 200 })

    const { result } = renderHook(() => useChatInbox())
    await waitFor(() => { expect(result.current.channels).toHaveLength(1) })

    await act(async() => { await result.current.markRead('seeker#req#donor') })

    expect(markChatRead).toHaveBeenCalledWith('seeker#req#donor', expect.anything())
    expect(result.current.channels[0].unread).toBe(false)
  })
})
