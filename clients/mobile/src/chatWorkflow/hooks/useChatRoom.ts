import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ChatMessageView, InboundEvent } from '../types'
import { ChatSocket } from '../ChatSocket'
import type { ChatSocketHandlers } from '../ChatSocket'
import type { ChatApiClient } from '../chatApi'
import { fetchHistory } from '../chatApi'
import { upsertMessage, mergeOlder } from '../messageList'
import { generateClientMessageId } from '../clientMessageId'

const TYPING_TIMEOUT_MS = 3000

const queueKey = (channelId: string): string => `chatQueue:${channelId}`

const readQueue = async (channelId: string): Promise<ChatMessageView[]> => {
  const raw = await AsyncStorage.getItem(queueKey(channelId))

  return raw !== null ? (JSON.parse(raw) as ChatMessageView[]) : []
}

const writeQueue = async (channelId: string, queue: ChatMessageView[]): Promise<void> => {
  await AsyncStorage.setItem(queueKey(channelId), JSON.stringify(queue))
}

export type UseChatRoomParams = {
  channelId: string;
  myUserId: string;
  token: string;
  websocketUrl: string;
  apiClient: ChatApiClient;
  createSocket?: (handlers: ChatSocketHandlers) => ChatSocket;
}

export type UseChatRoomResult = {
  messages: ChatMessageView[];
  isConnected: boolean;
  isOtherTyping: boolean;
  error: string;
  send: (body: string) => Promise<void>;
  loadOlder: () => Promise<void>;
  sendTyping: () => void;
}

export const useChatRoom = (params: UseChatRoomParams): UseChatRoomResult => {
  const { channelId, myUserId, token, websocketUrl, apiClient, createSocket } = params
  const [messages, setMessages] = useState<ChatMessageView[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState('')
  const socketRef = useRef<ChatSocket | null>(null)

  const handleEvent = useCallback((event: InboundEvent) => {
    if (event.type === 'MESSAGE') {
      setMessages((previous) => upsertMessage(previous, { ...event.message, status: 'sent' }))
    } else if (event.type === 'TYPING') {
      setIsOtherTyping(true)
      setTimeout(() => setIsOtherTyping(false), TYPING_TIMEOUT_MS)
    } else if (event.type === 'READ_RECEIPT' && event.userId !== myUserId) {
      setMessages((previous) =>
        previous.map((message) => (message.senderId === myUserId ? { ...message, status: 'read' } : message))
      )
    }
  }, [myUserId])

  const flushQueue = useCallback(async () => {
    const queued = await readQueue(channelId)
    queued.forEach((message) => {
      socketRef.current?.send({
        action: 'sendMessage',
        channelId,
        body: message.body,
        clientMessageId: message.clientMessageId
      })
    })
  }, [channelId])

  useEffect(() => {
    const handlers: ChatSocketHandlers = {
      onEvent: handleEvent,
      onOpen: () => {
        setIsConnected(true)
        void flushQueue()
        socketRef.current?.send({ action: 'markRead', channelId })
      },
      onClose: () => setIsConnected(false)
    }
    const socket = createSocket !== undefined
      ? createSocket(handlers)
      : new ChatSocket(websocketUrl, token, handlers)
    socketRef.current = socket
    socket.connect()

    void fetchHistory(apiClient, channelId)
      .then((page) => {
        setMessages((previous) =>
          mergeOlder(previous, page.items.map((message) => ({ ...message, status: 'sent' as const })))
        )
        setNextCursor(page.nextCursor)
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Failed to load history'))

    return () => socket.close()
  }, [channelId, token, websocketUrl, apiClient, createSocket, handleEvent, flushQueue])

  const send = useCallback(async (body: string) => {
    const clientMessageId = generateClientMessageId()
    const optimistic: ChatMessageView = {
      channelId,
      clientMessageId,
      senderId: myUserId,
      body,
      sentAt: new Date().toISOString(),
      status: 'sending'
    }
    setMessages((previous) => upsertMessage(previous, optimistic))

    const delivered = socketRef.current?.send({ action: 'sendMessage', channelId, body, clientMessageId }) ?? false
    if (!delivered) {
      const queued = await readQueue(channelId)
      queued.push({ ...optimistic, status: 'queued' })
      await writeQueue(channelId, queued)
      setMessages((previous) => upsertMessage(previous, { ...optimistic, status: 'queued' }))
    }
  }, [channelId, myUserId])

  const loadOlder = useCallback(async () => {
    if (nextCursor === null) {
      return
    }
    const page = await fetchHistory(apiClient, channelId, nextCursor)
    setMessages((previous) =>
      mergeOlder(previous, page.items.map((message) => ({ ...message, status: 'sent' as const })))
    )
    setNextCursor(page.nextCursor)
  }, [apiClient, channelId, nextCursor])

  const sendTyping = useCallback(() => {
    socketRef.current?.send({ action: 'typing', channelId })
  }, [channelId])

  return { messages, isConnected, isOtherTyping, error, send, loadOlder, sendTyping }
}
