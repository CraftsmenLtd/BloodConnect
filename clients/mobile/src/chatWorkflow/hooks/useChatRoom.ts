import { useState, useEffect, useCallback } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'
import { fetchChatHistory } from '../services/chatService'
import { useChatSocket } from './useChatSocket'
import type { ChatMessage, IncomingSocketMessage } from '../types'

type UseChatRoomParams = {
  channelId: string;
  initialLocked?: boolean;
}

type UseChatRoom = {
  messages: ChatMessage[];
  loading: boolean;
  errorMessage: string | null;
  locked: boolean;
  isConnected: boolean;
  currentUserId: string;
  sendMessage: (content: string) => void;
}

export const useChatRoom = ({ channelId, initialLocked }: UseChatRoomParams): UseChatRoom => {
  const fetchClient = useFetchClient()
  const { userProfile } = useUserProfile()
  const currentUserId = userProfile.userId
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [locked, setLocked] = useState<boolean>(initialLocked ?? false)

  const handleSocketMessage = useCallback(
    (incoming: IncomingSocketMessage): void => {
      if (incoming.type === 'message') {
        if (incoming.data.channelId !== channelId) {
          return
        }
        setMessages((previous) =>
          previous.some((message) => message.messageId === incoming.data.messageId)
            ? previous
            : [incoming.data, ...previous]
        )
      } else {
        setErrorMessage(incoming.message)
        if (incoming.message.toLowerCase().includes('locked')) {
          setLocked(true)
        }
      }
    },
    [channelId]
  )

  const { isConnected, sendMessage: socketSend } = useChatSocket({
    onMessage: handleSocketMessage
  })

  useEffect(() => {
    const loadHistory = async(): Promise<void> => {
      try {
        const data = await fetchChatHistory(fetchClient, channelId)
        setMessages(data.messages)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load messages.')
      } finally {
        setLoading(false)
      }
    }
    void loadHistory()
  }, [channelId, fetchClient])

  const sendMessage = useCallback(
    (content: string): void => {
      const trimmed = content.trim()
      if (trimmed === '' || locked) {
        return
      }
      socketSend(channelId, trimmed)
    },
    [channelId, locked, socketSend]
  )

  return {
    messages,
    loading,
    errorMessage,
    locked,
    isConnected,
    currentUserId,
    sendMessage
  }
}
