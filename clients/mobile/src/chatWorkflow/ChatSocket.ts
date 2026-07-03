import type { OutboundFrame, InboundEvent } from './types'

const MAX_BACKOFF_MS = 30000
const BASE_BACKOFF_MS = 1000
const OPEN_STATE = 1

export type WebSocketLike = {
  readyState: number;
  send: (data: string) => void;
  close: () => void;
  onopen: ((event?: unknown) => void) | null;
  onclose: ((event?: unknown) => void) | null;
  onerror: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
}

export type WebSocketFactory = (url: string) => WebSocketLike

export type ChatSocketHandlers = {
  onEvent: (event: InboundEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

const defaultFactory: WebSocketFactory = (url) => {
  const globalWebSocket = (globalThis as unknown as {
    WebSocket: new (url: string) => WebSocketLike;
  }).WebSocket

  return new globalWebSocket(url)
}

export class ChatSocket {
  private socket: WebSocketLike | null = null
  private reconnectAttempts = 0
  private closedByClient = false

  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly handlers: ChatSocketHandlers,
    private readonly factory: WebSocketFactory = defaultFactory
  ) {}

  connect(): void {
    this.closedByClient = false
    const socket = this.factory(`${this.url}?token=${encodeURIComponent(this.token)}`)
    this.socket = socket

    socket.onopen = () => {
      this.reconnectAttempts = 0
      this.handlers.onOpen?.()
    }
    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return
      }
      try {
        this.handlers.onEvent(JSON.parse(event.data) as InboundEvent)
      } catch {
        // ignore malformed frames
      }
    }
    socket.onclose = () => {
      this.handlers.onClose?.()
      if (!this.closedByClient) {
        this.scheduleReconnect()
      }
    }
    socket.onerror = () => {
      socket.close()
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** this.reconnectAttempts)
    this.reconnectAttempts += 1
    setTimeout(() => {
      if (!this.closedByClient) {
        this.connect()
      }
    }, delay)
  }

  send(frame: OutboundFrame): boolean {
    if (this.socket !== null && this.socket.readyState === OPEN_STATE) {
      this.socket.send(JSON.stringify(frame))

      return true
    }

    return false
  }

  isOpen(): boolean {
    return this.socket !== null && this.socket.readyState === OPEN_STATE
  }

  close(): void {
    this.closedByClient = true
    this.socket?.close()
  }
}
