/* global WebSocket, WebSocketMessageEvent */
import { useCallback, useEffect, useRef, useState } from 'react'
import Constants from 'expo-constants'
import { fetchSession } from '../../authentication/services/authService'
import type { IncomingSocketMessage, OutgoingSocketMessage } from '../types'

const { CHAT_WEBSOCKET_URL } = Constants.expoConfig?.extra ?? {}
const INITIAL_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 15000

type UseChatSocketParams = {
  onMessage: (message: IncomingSocketMessage) => void;
}

type UseChatSocket = {
  isConnected: boolean;
  sendMessage: (channelId: string, content: string) => void;
}

export const useChatSocket = ({ onMessage }: UseChatSocketParams): UseChatSocket => {
  const socketRef = useRef<WebSocket | null>(null)
  const pendingRef = useRef<OutgoingSocketMessage[]>([])
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY_MS)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUnmountedRef = useRef<boolean>(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  const flushPending = useCallback((): void => {
    const socket = socketRef.current
    if (socket === null || socket.readyState !== WebSocket.OPEN) {
      return
    }
    while (pendingRef.current.length > 0) {
      const message = pendingRef.current.shift()
      if (message !== undefined) {
        socket.send(JSON.stringify(message))
      }
    }
  }, [])

  const connect = useCallback(async(): Promise<void> => {
    if (CHAT_WEBSOCKET_URL === undefined || CHAT_WEBSOCKET_URL === '') {
      return
    }

    const { accessToken } = await fetchSession()
    if (accessToken === undefined || isUnmountedRef.current) {
      return
    }

    const socket = new WebSocket(`${CHAT_WEBSOCKET_URL}?token=${accessToken}`)
    socketRef.current = socket

    socket.onopen = (): void => {
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS
      setIsConnected(true)
      flushPending()
    }

    socket.onmessage = (event: WebSocketMessageEvent): void => {
      try {
        onMessage(JSON.parse(String(event.data)) as IncomingSocketMessage)
      } catch {
        // ignore malformed frames
      }
    }

    socket.onclose = (): void => {
      setIsConnected(false)
      socketRef.current = null
      scheduleReconnect()
    }

    socket.onerror = (): void => {
      socket.close()
    }
  }, [flushPending, onMessage])

  const scheduleReconnect = useCallback((): void => {
    if (isUnmountedRef.current) {
      return
    }
    reconnectTimerRef.current = setTimeout(() => {
      void connect()
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        MAX_RECONNECT_DELAY_MS
      )
    }, reconnectDelayRef.current)
  }, [connect])

  useEffect(() => {
    isUnmountedRef.current = false
    void connect()

    return (): void => {
      isUnmountedRef.current = true
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current)
      }
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [connect])

  const sendMessage = useCallback((channelId: string, content: string): void => {
    const message: OutgoingSocketMessage = { action: 'sendMessage', channelId, content }
    const socket = socketRef.current

    if (socket !== null && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    } else {
      pendingRef.current.push(message)
    }
  }, [])

  return { isConnected, sendMessage }
}
