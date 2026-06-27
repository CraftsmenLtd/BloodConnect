import { renderHook, act } from '@testing-library/react-native'
import storageService from '../../src/utility/storageService'
import { useChatQueue } from '../../src/chat/hooks/useChatQueue'
import { CHAT_OUTBOX_STORAGE_KEY } from '../../src/chat/constants/chatConstants'
import type { OutgoingChatMessage } from '../../src/chat/types'

jest.mock('../../src/utility/storageService', () => ({
  __esModule: true,
  default: {
    storeItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  }
}))

const mockStore = storageService.storeItem as jest.Mock
const mockGet = storageService.getItem as jest.Mock

const buildMessage = (messageId: string): OutgoingChatMessage => ({
  channelId: 'ch1',
  messageId,
  text: `text-${messageId}`,
  createdAt: `2026-06-26T10:00:0${messageId.slice(-1)}.000Z`
})

describe('useChatQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockResolvedValue(null)
    mockStore.mockResolvedValue(undefined)
  })

  it('loads a persisted queue on mount', async() => {
    mockGet.mockResolvedValueOnce([buildMessage('m1')])

    const { result } = renderHook(() => useChatQueue())
    await act(async() => {
      await Promise.resolve()
    })

    expect(mockGet).toHaveBeenCalledWith(CHAT_OUTBOX_STORAGE_KEY)
    expect(result.current.queue).toHaveLength(1)
  })

  it('queues messages while offline and dedupes by messageId', async() => {
    const { result } = renderHook(() => useChatQueue())
    const message = buildMessage('m1')

    await act(async() => {
      await result.current.enqueue(message)
    })
    await act(async() => {
      await result.current.enqueue(message)
    })

    expect(result.current.queue).toHaveLength(1)
    expect(mockStore).toHaveBeenLastCalledWith(CHAT_OUTBOX_STORAGE_KEY, [message])
  })

  it('flushes each queued message once and clears the queue', async() => {
    const sender = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useChatQueue())

    await act(async() => {
      await result.current.enqueue(buildMessage('m1'))
      await result.current.enqueue(buildMessage('m2'))
    })

    await act(async() => {
      await result.current.flush(sender)
    })

    expect(sender).toHaveBeenCalledTimes(2)
    expect(result.current.queue).toHaveLength(0)
  })

  it('flushes only once when invoked concurrently (no duplicate sends)', async() => {
    const sender = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useChatQueue())

    await act(async() => {
      await result.current.enqueue(buildMessage('m1'))
      await result.current.enqueue(buildMessage('m2'))
    })

    await act(async() => {
      await Promise.all([result.current.flush(sender), result.current.flush(sender)])
    })

    expect(sender).toHaveBeenCalledTimes(2)
    expect(result.current.queue).toHaveLength(0)
  })
})
