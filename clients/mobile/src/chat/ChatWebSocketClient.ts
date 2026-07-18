import { log } from '../utility/logger'
import type { ChatMessageDTO, ChatSendPayload } from './chatTypes'

export type ChatSocketState = 'connecting' | 'open' | 'closed'

// Minimal structural type so a real RN WebSocket and a test double are interchangeable.
export type WebSocketLike = {
  send: (data: string) => void;
  close: () => void;
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onclose: (() => void) | null;
  onerror: ((error: unknown) => void) | null;
}

type MessageListener = (message: ChatMessageDTO) => void
type StateListener = (state: ChatSocketState) => void

export type ChatWebSocketOptions = {
  url: string;
  getToken: () => Promise<string | undefined>;
  webSocketFactory?: (url: string) => WebSocketLike;
  baseReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

const DEFAULT_BASE_RECONNECT_DELAY_MS = 1000
const DEFAULT_MAX_RECONNECT_DELAY_MS = 30000

// Authenticated WebSocket client for chat with exponential-backoff reconnection. The token rides the
// query string because WebSocket clients cannot set headers on $connect (the $connect authorizer
// reads route.request.querystring.token). A live-endpoint connection is verified manually on a
// deployed dev environment; the unit tests cover reconnection/backoff with an injected socket.
export class ChatWebSocketClient {
  private readonly url: string
  private readonly getToken: () => Promise<string | undefined>
  private readonly webSocketFactory: (url: string) => WebSocketLike
  private readonly baseReconnectDelayMs: number
  private readonly maxReconnectDelayMs: number

  private socket: WebSocketLike | null = null
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closedByClient = false
  private state: ChatSocketState = 'closed'
  private readonly messageListeners = new Set<MessageListener>()
  private readonly stateListeners = new Set<StateListener>()

  constructor(options: ChatWebSocketOptions) {
    this.url = options.url
    this.getToken = options.getToken
    this.webSocketFactory = options.webSocketFactory
      ?? ((url) => new globalThis.WebSocket(url) as unknown as WebSocketLike)
    this.baseReconnectDelayMs = options.baseReconnectDelayMs ?? DEFAULT_BASE_RECONNECT_DELAY_MS
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_DELAY_MS
  }

  async connect(): Promise<void> {
    this.closedByClient = false
    this.clearReconnectTimer()
    this.setState('connecting')

    const token = await this.getToken()
    if (token === undefined || token === '') {
      log.error('chat websocket: no auth token, scheduling reconnect')
      this.scheduleReconnect()

      return
    }

    const separator = this.url.includes('?') ? '&' : '?'
    const socket = this.webSocketFactory(`${this.url}${separator}token=${encodeURIComponent(token)}`)
    this.socket = socket

    socket.onopen = () => {
      this.reconnectAttempts = 0
      this.setState('open')
    }
    socket.onmessage = (event) => { this.handleMessage(event.data) }
    socket.onerror = (error) => { log.error('chat websocket error', error) }
    socket.onclose = () => {
      this.socket = null
      this.setState('closed')
      if (!this.closedByClient) {
        this.scheduleReconnect()
      }
    }
  }

  // Returns false when the socket is not open so the caller can queue the message for a later flush.
  send(payload: ChatSendPayload): boolean {
    if (this.socket === null || this.state !== 'open') {
      return false
    }
    try {
      this.socket.send(JSON.stringify({ action: 'sendMessage', ...payload }))

      return true
    } catch (error) {
      log.error('chat websocket: send failed', error)

      return false
    }
  }

  close(): void {
    this.closedByClient = true
    this.clearReconnectTimer()
    this.socket?.close()
    this.socket = null
    this.setState('closed')
  }

  getState(): ChatSocketState {
    return this.state
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener)

    return () => { this.messageListeners.delete(listener) }
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener)

    return () => { this.stateListeners.delete(listener) }
  }

  private handleMessage(raw: string): void {
    try {
      const message = JSON.parse(raw) as ChatMessageDTO
      this.messageListeners.forEach((listener) => { listener(message) })
    } catch (error) {
      log.error('chat websocket: failed to parse message', error)
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer()
    const delay = Math.min(
      this.baseReconnectDelayMs * 2 ** this.reconnectAttempts,
      this.maxReconnectDelayMs
    )
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => { void this.connect() }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setState(state: ChatSocketState): void {
    if (this.state === state) return
    this.state = state
    this.stateListeners.forEach((listener) => { listener(state) })
  }
}
