import { ChatWebSocketClient } from '../../src/chat/ChatWebSocketClient'
import type { WebSocketLike } from '../../src/chat/ChatWebSocketClient'

type FakeSocket = WebSocketLike & { sent: string[] }

const createFakeSocket = (): FakeSocket => ({
  sent: [],
  send(data: string) { this.sent.push(data) },
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null
})

const setup = () => {
  const sockets: FakeSocket[] = []
  const urls: string[] = []
  const client = new ChatWebSocketClient({
    url: 'wss://example/chat',
    getToken: async() => 'tok en',
    webSocketFactory: (url: string) => {
      urls.push(url)
      const socket = createFakeSocket()
      sockets.push(socket)

      return socket
    },
    baseReconnectDelayMs: 1000,
    maxReconnectDelayMs: 8000
  })

  return { client, sockets, urls }
}

describe('ChatWebSocketClient', () => {
  beforeEach(() => { jest.useFakeTimers() })
  afterEach(() => { jest.useRealTimers() })

  it('connects with the auth token on the query string', async() => {
    const { client, urls } = setup()

    await client.connect()

    expect(urls[0]).toBe('wss://example/chat?token=tok%20en')
  })

  it('reconnects with exponential backoff after an unexpected close', async() => {
    const { client, sockets, urls } = setup()
    await client.connect()
    expect(urls).toHaveLength(1)

    sockets[0].onclose?.()
    await jest.advanceTimersByTimeAsync(999)
    expect(urls).toHaveLength(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(urls).toHaveLength(2)

    sockets[1].onclose?.()
    await jest.advanceTimersByTimeAsync(1999)
    expect(urls).toHaveLength(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(urls).toHaveLength(3)
  })

  it('resets the backoff to the base delay after a successful open', async() => {
    const { client, sockets, urls } = setup()
    await client.connect()

    sockets[0].onclose?.()
    await jest.advanceTimersByTimeAsync(1000)
    expect(urls).toHaveLength(2)

    sockets[1].onopen?.()
    sockets[1].onclose?.()
    await jest.advanceTimersByTimeAsync(999)
    expect(urls).toHaveLength(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(urls).toHaveLength(3)
  })

  it('does not reconnect after an explicit close', async() => {
    const { client, sockets, urls } = setup()
    await client.connect()

    client.close()
    expect(sockets[0].close).toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(10000)
    expect(urls).toHaveLength(1)
  })

  it('only sends when open and frames the sendMessage action', async() => {
    const { client, sockets } = setup()
    await client.connect()

    expect(client.send({ channelId: 'c', content: 'hi' })).toBe(false)

    sockets[0].onopen?.()
    expect(client.send({ channelId: 'c', content: 'hi' })).toBe(true)
    expect(JSON.parse(sockets[0].sent[0])).toEqual({ action: 'sendMessage', channelId: 'c', content: 'hi' })
  })

  it('delivers parsed messages to subscribers', async() => {
    const { client, sockets } = setup()
    const received: unknown[] = []
    client.onMessage((message) => { received.push(message) })

    await client.connect()
    sockets[0].onmessage?.({ data: JSON.stringify({ messageId: '1', content: 'yo' }) })

    expect(received).toEqual([{ messageId: '1', content: 'yo' }])
  })
})
