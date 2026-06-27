import { useCallback, useEffect, useRef, useState } from 'react'
import type { HttpClient } from '../../setup/clients/HttpClient'
import { fetchChatHistory } from '../services/chatService'
import { CHAT_HISTORY_PAGE_SIZE } from '../constants/chatConstants'
import type { ChatHistoryCursor, ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'

export type UseChatMessagesResult = {
  messages: ChatMessageDTO[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  addMessages: (incoming: ChatMessageDTO[]) => void;
}

const compareMessages = (a: ChatMessageDTO, b: ChatMessageDTO): number => {
  if (a.createdAt === b.createdAt) {
    return a.messageId < b.messageId ? -1 : 1
  }

  return a.createdAt < b.createdAt ? -1 : 1
}

export const mergeMessages = (existing: ChatMessageDTO[], incoming: ChatMessageDTO[]): ChatMessageDTO[] => {
  const byId = new Map<string, ChatMessageDTO>()
  for (const message of [...existing, ...incoming]) {
    byId.set(message.messageId, message)
  }

  return Array.from(byId.values()).sort(compareMessages)
}

export const useChatMessages = (channelId: string, httpClient: HttpClient): UseChatMessagesResult => {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const cursorRef = useRef<ChatHistoryCursor | undefined>(undefined)

  const addMessages = useCallback((incoming: ChatMessageDTO[]): void => {
    setMessages((current) => mergeMessages(current, incoming))
  }, [])

  const loadMore = useCallback(async(): Promise<void> => {
    if (loading || !hasMore) {
      return
    }
    setLoading(true)
    try {
      const query = { channelId, limit: CHAT_HISTORY_PAGE_SIZE, lastEvaluatedKey: cursorRef.current }
      const result = await fetchChatHistory(query, httpClient)
      cursorRef.current = result.lastEvaluatedKey
      setHasMore(result.lastEvaluatedKey !== undefined)
      setMessages((current) => mergeMessages(current, result.messages))
    } finally {
      setLoading(false)
    }
  }, [channelId, httpClient, loading, hasMore])

  useEffect(() => {
    cursorRef.current = undefined
    setMessages([])
    setHasMore(true)
  }, [channelId])

  return { messages, loading, hasMore, loadMore, addMessages }
}
