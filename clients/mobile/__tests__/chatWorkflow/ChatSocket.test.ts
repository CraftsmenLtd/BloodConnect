import { ChatSocket } from '../../src/chatWorkflow/ChatSocket'
import type { WebSocketLike } from '../../src/chatWorkflow/ChatSocket'

const makeFakeSocket = (): WebSocketLike => ({
  readyState: 0,
  send: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onclose: null,
  onerror: null,
  onmessage: null
})

describe('ChatSocket', () => {
  it('passes the token (url-encoded) on connect', () => {
    const factory = jest.fn(() => makeFakeSocket())
    new ChatSocket('wss://host/dev', 'my token', { onEvent: jest.fn() }, factory).connect()
    expect(factory).toHaveBeenCalledWith('wss://host/dev?token=my%20token')
  })

  it('sends a frame when the socket is open', () => {
    const fake = makeFakeSocket()
    const socket = new ChatSocket('wss://h', 't', { onEvent: jest.fn() }, () => fake)
    socket.connect()
    fake.readyState = 1
    const sent = socket.send({ action: 'typing', channelId: 'req-1#donor-1' })
    expect(sent).toBe(true)
    expect(fake.send).toHaveBeenCalledWith(JSON.stringify({ action: 'typing', channelId: 'req-1#donor-1' }))
  })

  it('returns false (does not send) when the socket is not open', () => {
    const fake = makeFakeSocket()
    const socket = new ChatSocket('wss://h', 't', { onEvent: jest.fn() }, () => fake)
    socket.connect()
    fake.readyState = 0
    expect(socket.send({ action: 'typing', channelId: 'c#d' })).toBe(false)
    expect(fake.send).not.toHaveBeenCalled()
  })

  it('dispatches parsed inbound events and ignores malformed frames', () => {
    const onEvent = jest.fn()
    const fake = makeFakeSocket()
    new ChatSocket('wss://h', 't', { onEvent }, () => fake).connect()

    fake.onmessage?.({ data: JSON.stringify({ type: 'TYPING', channelId: 'c#d', userId: 'u' }) })
    expect(onEvent).toHaveBeenCalledWith({ type: 'TYPING', channelId: 'c#d', userId: 'u' })

    onEvent.mockClear()
    fake.onmessage?.({ data: 'not-json' })
    expect(onEvent).not.toHaveBeenCalled()
  })

  it('closes intentionally without reconnecting', () => {
    const fake = makeFakeSocket()
    const socket = new ChatSocket('wss://h', 't', { onEvent: jest.fn() }, () => fake)
    socket.connect()
    socket.close()
    expect(fake.close).toHaveBeenCalled()
  })
})
