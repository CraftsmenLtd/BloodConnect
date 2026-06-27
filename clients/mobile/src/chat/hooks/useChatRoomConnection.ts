import { useCallback } from 'react'
import Constants from 'expo-constants'
import authService from '../../authentication/services/authService'
import type { HttpClient } from '../../setup/clients/HttpClient'
import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import type { OutgoingChatMessage } from '../types'
import { useChatConnection } from './useChatConnection'
import { useChatQueue } from './useChatQueue'
import { sendChatMessageRest } from '../services/chatService'
import { frameToMessage } from '../utils/incomingFrame'

const { WEBSOCKET_URL } = Constants.expoConfig?.extra ?? {}

const SEND_MESSAGE_ACTION = 'sendmessage'

export type UseChatRoomConnectionResult = {
  isConnected: boolean;
  sendOrQueue: (message: OutgoingChatMessage) => Promise<void>;
}

const getToken = async(): Promise<string | undefined> =>
  (await authService.fetchSession()).idToken

const toWsFrame = (message: OutgoingChatMessage): string => JSON.stringify({
  action: SEND_MESSAGE_ACTION,
  channelId: message.channelId,
  text: message.text,
  messageId: message.messageId,
  clientCreatedAt: message.createdAt
})

// Mounts the chat WebSocket while a room is open: inbound CHAT_MESSAGE frames flow into
// the provided cache sink, and the offline outbox is flushed (over REST) on every (re)connect.
export const useChatRoomConnection = (
  httpClient: HttpClient,
  onIncoming: (message: ChatMessageDTO) => void
): UseChatRoomConnectionResult => {
  const { enqueue, flush } = useChatQueue()

  const restSender = useCallback(
    async(message: OutgoingChatMessage): Promise<void> => { await sendChatMessageRest(message, httpClient) },
    [httpClient]
  )

  const handleMessage = useCallback((data: unknown): void => {
    const message = frameToMessage(data)
    if (message !== null) {
      onIncoming(message)
    }
  }, [onIncoming])

  const handleOpen = useCallback((): void => { void flush(restSender) }, [flush, restSender])

  const { isConnected, send } = useChatConnection({
    url: WEBSOCKET_URL,
    getToken,
    onMessage: handleMessage,
    onOpen: handleOpen
  })

  const sendOrQueue = useCallback(async(message: OutgoingChatMessage): Promise<void> => {
    if (isConnected && send(toWsFrame(message))) {
      return
    }
    await enqueue(message)
  }, [isConnected, send, enqueue])

  return { isConnected, sendOrQueue }
}
