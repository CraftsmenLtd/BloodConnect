import { useCallback, useEffect, useRef, useState } from 'react'
import storageService from '../../utility/storageService'
import { CHAT_OUTBOX_STORAGE_KEY } from '../constants/chatConstants'
import type { OutgoingChatMessage } from '../types'

export type ChatMessageSender = (message: OutgoingChatMessage) => Promise<void>

export type UseChatQueueResult = {
  queue: OutgoingChatMessage[];
  enqueue: (message: OutgoingChatMessage) => Promise<void>;
  flush: (sender: ChatMessageSender) => Promise<void>;
  clear: () => Promise<void>;
}

type QueueRef = { current: OutgoingChatMessage[] }
type Persist = (next: OutgoingChatMessage[]) => Promise<void>

const loadPersistedQueue = async(persist: Persist): Promise<void> => {
  const stored = await storageService.getItem<OutgoingChatMessage[]>(CHAT_OUTBOX_STORAGE_KEY)
  if (stored !== null && stored.length > 0) {
    await persist(stored)
  }
}

const drainQueue = async(sender: ChatMessageSender, queueRef: QueueRef, persist: Persist): Promise<void> => {
  const pending = [...queueRef.current]
  for (const message of pending) {
    await sender(message)
    await persist(queueRef.current.filter((item) => item.messageId !== message.messageId))
  }
}

export const useChatQueue = (): UseChatQueueResult => {
  const [queue, setQueue] = useState<OutgoingChatMessage[]>([])
  const queueRef = useRef<OutgoingChatMessage[]>([])
  const flushingRef = useRef<boolean>(false)

  const persist = useCallback(async(next: OutgoingChatMessage[]): Promise<void> => {
    queueRef.current = next
    setQueue(next)
    await storageService.storeItem(CHAT_OUTBOX_STORAGE_KEY, next)
  }, [])

  useEffect(() => {
    void loadPersistedQueue(persist)
  }, [persist])

  const enqueue = useCallback(async(message: OutgoingChatMessage): Promise<void> => {
    if (queueRef.current.some((item) => item.messageId === message.messageId)) {
      return
    }
    await persist([...queueRef.current, message])
  }, [persist])

  const flush = useCallback(async(sender: ChatMessageSender): Promise<void> => {
    if (flushingRef.current) {
      return
    }
    flushingRef.current = true
    try {
      await drainQueue(sender, queueRef, persist)
    } finally {
      flushingRef.current = false
    }
  }, [persist])

  const clear = useCallback(async(): Promise<void> => {
    await persist([])
  }, [persist])

  return { queue, enqueue, flush, clear }
}
