import { renderHook, act } from '@testing-library/react-native'
import type { UseChatConnectionOptions, UseChatConnectionResult } from '../../src/chat/hooks/useChatConnection'
import { sendChatMessageRest } from '../../src/chat/services/chatService'
import { useChatRoomConnection } from '../../src/chat/hooks/useChatRoomConnection'
import type { HttpClient } from '../../src/setup/clients/HttpClient'
import type { ChatMessageDTO } from '../../../../commons/dto/ChatDTO'

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { WEBSOCKET_URL: 'wss://chat.test' } } }
}))

jest.mock('../../src/authentication/services/authService', () => ({
  __esModule: true,
  default: { fetchSession: jest.fn().mockResolvedValue({ idToken: 'id-token' }) }
}))

jest.mock('../../src/utility/storageService', () => ({
  __esModule: true,
  default: {
    storeItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined)
  }
}))

jest.mock('../../src/chat/services/chatService', () => ({
  sendChatMessageRest: jest.fn().mockResolvedValue({ status: 200 })
}))

// Capture the options useChatRoomConnection wires into the (already-tested) socket hook
// so the test can drive inbound frames and reconnect without a real WebSocket.
// `mock`-prefixed names are the only outer vars a jest.mock factory may reference.
const mockCaptured: { options?: UseChatConnectionOptions } = {}
const mockSocketSend = jest.fn((_data: string): boolean => false)

jest.mock('../../src/chat/hooks/useChatConnection', () => ({
  useChatConnection: (options: UseChatConnectionOptions): UseChatConnectionResult => {
    mockCaptured.options = options

    return { status: 'disconnected', isConnected: false, send: mockSocketSend, connect: jest.fn(), disconnect: jest.fn() }
  }
}))

const httpClient = { get: jest.fn(), post: jest.fn(), patch: jest.fn() } as unknown as HttpClient
const mockSend = sendChatMessageRest as jest.Mock

const inboundFrame = {
  type: 'CHAT_MESSAGE',
  channelId: 'ch1',
  messageId: 'inbound-1',
  senderId: 'donor-1',
  text: 'hello from donor',
  createdAt: '2026-06-26T10:00:00.000Z'
}

describe('useChatRoomConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSocketSend.mockReturnValue(false)
    mockCaptured.options = undefined
  })

  it('routes an inbound CHAT_MESSAGE frame into the cache sink', () => {
    const onIncoming = jest.fn<void, [ChatMessageDTO]>()
    renderHook(() => useChatRoomConnection(httpClient, onIncoming))

    act(() => {
      mockCaptured.options?.onMessage(inboundFrame)
    })

    expect(onIncoming).toHaveBeenCalledTimes(1)
    expect(onIncoming).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'ch1', messageId: 'inbound-1', text: 'hello from donor' })
    )
  })

  it('ignores non-chat frames', () => {
    const onIncoming = jest.fn<void, [ChatMessageDTO]>()
    renderHook(() => useChatRoomConnection(httpClient, onIncoming))

    act(() => {
      mockCaptured.options?.onMessage({ type: 'SOMETHING_ELSE' })
    })

    expect(onIncoming).not.toHaveBeenCalled()
  })

  it('flushes a message queued while offline once the socket (re)connects', async() => {
    const { result } = renderHook(() => useChatRoomConnection(httpClient, jest.fn()))

    // Offline (send returns false) -> the message is queued, nothing sent yet.
    await act(async() => {
      await result.current.sendOrQueue({ channelId: 'ch1', messageId: 'queued-1', text: 'queued', createdAt: '2026-06-26T10:01:00.000Z' })
    })
    expect(mockSend).not.toHaveBeenCalled()

    // Reconnect fires onOpen -> the outbox drains over REST.
    await act(async() => {
      mockCaptured.options?.onOpen?.()
      await Promise.resolve()
    })

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ messageId: 'queued-1' }), httpClient)
  })
})
