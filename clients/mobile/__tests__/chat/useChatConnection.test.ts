import { renderHook, act } from '@testing-library/react-native'
import { useChatConnection } from '../../src/chat/hooks/useChatConnection'
import type { WebSocketLike } from '../../src/chat/types'

type FakeSocket = WebSocketLike & {
  open: () => void;
  closeRemote: () => void;
  emit: (data: unknown) => void;
}

const makeFakeSocket = (): FakeSocket => {
  const socket = {
    readyState: 0,
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
    send: jest.fn(),
    close: jest.fn()
  } as unknown as FakeSocket

  socket.open = () => {
    socket.readyState = 1
    socket.onopen?.(undefined)
  }
  socket.closeRemote = () => {
    socket.readyState = 3
    socket.onclose?.(undefined)
  }
  socket.emit = (data) => {
    socket.onmessage?.({ data })
  }

  return socket
}

const flushMicrotasks = async(): Promise<void> => {
  await act(async() => {
    await Promise.resolve()
  })
}

describe('useChatConnection', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('connects with the token in the Authorization header factory and reports status', async() => {
    const sockets: FakeSocket[] = []
    const socketFactory = jest.fn(() => {
      const socket = makeFakeSocket()
      sockets.push(socket)

      return socket
    })
    const getToken = jest.fn().mockResolvedValue('jwt-token')
    const onMessage = jest.fn()

    const { result } = renderHook(() => useChatConnection({
      url: 'wss://chat.example',
      getToken,
      onMessage,
      socketFactory,
      reconnectDelayMs: 1000
    }))

    await flushMicrotasks()

    expect(socketFactory).toHaveBeenCalledWith('wss://chat.example', 'jwt-token')
    expect(result.current.status).toBe('connecting')

    act(() => sockets[0].open())
    expect(result.current.status).toBe('connected')
    expect(result.current.isConnected).toBe(true)

    act(() => sockets[0].emit(JSON.stringify({ messageId: 'm1', text: 'hi' })))
    expect(onMessage).toHaveBeenCalledWith({ messageId: 'm1', text: 'hi' })
  })

  it('auto-reconnects after the socket closes unexpectedly', async() => {
    const sockets: FakeSocket[] = []
    const socketFactory = jest.fn(() => {
      const socket = makeFakeSocket()
      sockets.push(socket)

      return socket
    })

    const { result } = renderHook(() => useChatConnection({
      url: 'wss://chat.example',
      getToken: jest.fn().mockResolvedValue('jwt-token'),
      onMessage: jest.fn(),
      socketFactory,
      reconnectDelayMs: 1000
    }))

    await flushMicrotasks()
    act(() => sockets[0].open())
    act(() => sockets[0].closeRemote())
    expect(result.current.status).toBe('disconnected')

    await act(async() => {
      jest.advanceTimersByTime(1000)
      await Promise.resolve()
    })

    expect(socketFactory).toHaveBeenCalledTimes(2)
  })

  it('does not reconnect after an explicit disconnect', async() => {
    const socketFactory = jest.fn(() => makeFakeSocket())

    const { result } = renderHook(() => useChatConnection({
      url: 'wss://chat.example',
      getToken: jest.fn().mockResolvedValue('jwt-token'),
      onMessage: jest.fn(),
      socketFactory,
      reconnectDelayMs: 1000
    }))

    await flushMicrotasks()
    const callsBeforeDisconnect = socketFactory.mock.calls.length

    act(() => result.current.disconnect())
    expect(result.current.status).toBe('disconnected')

    await act(async() => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    expect(socketFactory).toHaveBeenCalledTimes(callsBeforeDisconnect)
  })
})
