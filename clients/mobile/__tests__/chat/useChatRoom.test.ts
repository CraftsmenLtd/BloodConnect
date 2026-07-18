import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useChatRoom } from '../../src/chat/useChatRoom'
import { fetchChatHistory, markChatRead } from '../../src/chat/chatService'
import { createChatWebSocketClient } from '../../src/chat/chatClientFactory'

jest.mock('../../src/setup/clients/useFetchClient', () => ({
  useFetchClient: () => ({})
}))

jest.mock('../../src/chat/chatService', () => ({
  fetchChatHistory: jest.fn(),
  markChatRead: jest.fn()
}))

jest.mock('../../src/chat/chatClientFactory', () => ({
  createChatWebSocketClient: jest.fn()
}))

const makeFakeClient = () => {
  let stateListener: ((state: string) => void) | null = null
  let online = false

  return {
    connect: jest.fn(),
    close: jest.fn(),
    send: jest.fn(() => online),
    onMessage: jest.fn(() => jest.fn()),
    onStateChange: jest.fn((listener: (state: string) => void) => {
      stateListener = listener

      return jest.fn()
    }),
    goOnline() {
      online = true
      stateListener?.('open')
    }
  }
}

describe('useChatRoom', () => {
  afterEach(() => { jest.clearAllMocks() })

  it('marks the channel read on open', async() => {
    (fetchChatHistory as jest.Mock).mockResolvedValue({ data: { channel: null, page: { items: [] } }, status: 200 })
    ;(markChatRead as jest.Mock).mockResolvedValue({ success: true })
    ;(createChatWebSocketClient as jest.Mock).mockReturnValue(makeFakeClient())

    const { result } = renderHook(() => useChatRoom('chan'))

    await waitFor(() => { expect(result.current.loading).toBe(false) })
    expect(markChatRead).toHaveBeenCalledWith('chan', expect.anything())
  })

  it('queues a send made while offline and flushes it on reconnect', async() => {
    const fakeClient = makeFakeClient()
    ;(fetchChatHistory as jest.Mock).mockResolvedValue({ data: { channel: null, page: { items: [] } }, status: 200 })
    ;(markChatRead as jest.Mock).mockResolvedValue({})
    ;(createChatWebSocketClient as jest.Mock).mockReturnValue(fakeClient)

    const { result } = renderHook(() => useChatRoom('chan'))
    await waitFor(() => { expect(result.current.loading).toBe(false) })

    act(() => { result.current.send('hello') })
    expect(fakeClient.send).toHaveBeenCalledTimes(1)

    act(() => { fakeClient.goOnline() })
    expect(fakeClient.send).toHaveBeenCalledTimes(2)
    expect(fakeClient.send).toHaveBeenLastCalledWith({ channelId: 'chan', content: 'hello' })
  })
})
