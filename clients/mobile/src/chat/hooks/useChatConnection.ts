import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_RECONNECT_DELAY_MS, WEBSOCKET_OPEN } from '../constants/chatConstants'
import type { ConnectionStatus, SocketFactory, WebSocketLike } from '../types'

export type UseChatConnectionOptions = {
  url?: string;
  getToken: () => Promise<string | undefined>;
  onMessage: (data: unknown) => void;
  enabled?: boolean;
  reconnectDelayMs?: number;
  socketFactory?: SocketFactory;
  onOpen?: () => void;
}

export type UseChatConnectionResult = {
  status: ConnectionStatus;
  isConnected: boolean;
  send: (data: string) => boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

type WebSocketOptions = { headers?: Record<string, string> }

type SocketHandlers = {
  setStatus: (status: ConnectionStatus) => void;
  onMessage: (data: unknown) => void;
  onOpen?: () => void;
  scheduleReconnect: () => void;
}

type WebSocketCtor = new(url: string, protocols: undefined, options: WebSocketOptions) => WebSocketLike

const defaultSocketFactory: SocketFactory = (url, token) => {
  const options: WebSocketOptions = token !== undefined ? { headers: { Authorization: `Bearer ${token}` } } : {}
  const SocketCtor = (global as unknown as { WebSocket: WebSocketCtor }).WebSocket

  return new SocketCtor(url, undefined, options)
}

const parseSocketData = (data: unknown): unknown => {
  if (typeof data !== 'string') {
    return data
  }
  try {
    return JSON.parse(data)
  } catch (_error) {
    return data
  }
}

const wireSocket = (socket: WebSocketLike, handlers: SocketHandlers): void => {
  socket.onopen = () => {
    handlers.setStatus('connected')
    handlers.onOpen?.()
  }
  socket.onmessage = (event) => {
    handlers.onMessage(parseSocketData(event.data))
  }
  socket.onclose = () => {
    handlers.setStatus('disconnected')
    handlers.scheduleReconnect()
  }
  socket.onerror = () => {
    socket.close()
  }
}

export const useChatConnection = (options: UseChatConnectionOptions): UseChatConnectionResult => {
  const { url, enabled = true } = options
  const reconnectDelayMs = options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const socketRef = useRef<WebSocketLike | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enabledRef = useRef<boolean>(enabled)
  const connectRef = useRef<() => Promise<void>>(() => Promise.resolve())
  // Latest callback props are kept in refs so inline consumer callbacks never
  // churn the connect identity and trigger reconnect storms.
  const getTokenRef = useRef(options.getToken)
  const onMessageRef = useRef(options.onMessage)
  const onOpenRef = useRef(options.onOpen)
  const socketFactoryRef = useRef<SocketFactory>(options.socketFactory ?? defaultSocketFactory)
  getTokenRef.current = options.getToken
  onMessageRef.current = options.onMessage
  onOpenRef.current = options.onOpen
  socketFactoryRef.current = options.socketFactory ?? defaultSocketFactory

  const clearReconnectTimer = useCallback((): void => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const scheduleReconnect = useCallback((): void => {
    if (!enabledRef.current) {
      return
    }
    clearReconnectTimer()
    reconnectTimerRef.current = setTimeout(() => {
      void connectRef.current()
    }, reconnectDelayMs)
  }, [clearReconnectTimer, reconnectDelayMs])

  const connect = useCallback(async(): Promise<void> => {
    if (url === undefined || url === '') {
      return
    }
    clearReconnectTimer()
    setStatus('connecting')
    const token = await getTokenRef.current()
    const socket = socketFactoryRef.current(url, token)
    socketRef.current = socket
    wireSocket(socket, {
      setStatus,
      onMessage: (data) => onMessageRef.current(data),
      onOpen: () => onOpenRef.current?.(),
      scheduleReconnect
    })
  }, [url, scheduleReconnect, clearReconnectTimer])

  const disconnect = useCallback((): void => {
    clearReconnectTimer()
    const socket = socketRef.current
    socketRef.current = null
    if (socket !== null) {
      socket.onclose = null
      socket.close()
    }
    setStatus('disconnected')
  }, [clearReconnectTimer])

  const send = useCallback((data: string): boolean => {
    const socket = socketRef.current
    if (socket === null || socket.readyState !== WEBSOCKET_OPEN) {
      return false
    }
    socket.send(data)

    return true
  }, [])

  connectRef.current = connect

  useEffect(() => {
    enabledRef.current = enabled
    if (enabled) {
      void connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return { status, isConnected: status === 'connected', send, connect, disconnect }
}
