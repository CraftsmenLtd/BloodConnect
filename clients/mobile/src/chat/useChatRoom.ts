import { useCallback, useEffect, useRef, useState } from 'react'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { log } from '../utility/logger'
import { createChatWebSocketClient } from './chatClientFactory'
import type { ChatWebSocketClient } from './ChatWebSocketClient'
import { fetchChatHistory, markChatRead } from './chatService'
import type { ChatMessageDTO } from './chatTypes'

type UseChatRoomResult = {
  messages: ChatMessageDTO[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  send: (content: string) => void;
}

// Drives a single chat room: loads newest-first history over REST, opens the live WebSocket, marks
// the channel read on open, appends fanned-out messages, and queues sends made while offline,
// flushing them when the socket reconnects.
export const useChatRoom = (channelId: string): UseChatRoomResult => {
  // useFetchClient returns a fresh client each render; hold it in a ref so the socket-lifecycle
  // effect keys only on channelId and does not tear down/reconnect on every render.
  const fetchClient = useFetchClient()
  const fetchClientRef = useRef(fetchClient)
  fetchClientRef.current = fetchClient
  const [messages, setMessages] = useState<ChatMessageDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<ChatWebSocketClient | null>(null)
  const offlineQueueRef = useRef<string[]>([])

  const flushQueue = useCallback((): void => {
    const queued = offlineQueueRef.current
    offlineQueueRef.current = []
    queued.forEach((content) => {
      const delivered = clientRef.current?.send({ channelId, content }) ?? false
      if (!delivered) offlineQueueRef.current.push(content)
    })
  }, [channelId])

  const send = useCallback((content: string): void => {
    if (content === '') return
    const delivered = clientRef.current?.send({ channelId, content }) ?? false
    if (!delivered) offlineQueueRef.current.push(content)
  }, [channelId])

  useEffect(() => {
    let active = true
    const client = createChatWebSocketClient()
    clientRef.current = client

    const loadHistory = async(): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchChatHistory(channelId, fetchClientRef.current)
        if (active) setMessages(response.data?.items ?? [])
      } catch (historyError) {
        if (active) {
          setError(historyError instanceof Error ? historyError.message : 'Failed to load messages.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadHistory()
    void markChatRead(channelId, fetchClientRef.current).catch((markError) => { log.error(markError) })

    const unsubscribers: Array<() => void> = []
    if (client !== null) {
      unsubscribers.push(client.onMessage((message) => {
        setMessages((previous) => [message, ...previous])
      }))
      unsubscribers.push(client.onStateChange((state) => {
        setConnected(state === 'open')
        if (state === 'open') flushQueue()
      }))
      void client.connect()
    }

    return () => {
      active = false
      unsubscribers.forEach((unsubscribe) => { unsubscribe() })
      client?.close()
    }
  }, [channelId, flushQueue])

  return { messages, loading, error, connected, send }
}
