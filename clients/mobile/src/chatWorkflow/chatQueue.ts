import type { ChatMessageView } from './types'

export type OutboxState = { pending: ChatMessageView[] }

export const emptyOutbox = (): OutboxState => ({ pending: [] })

export const enqueue = (state: OutboxState, message: ChatMessageView): OutboxState => {
  if (state.pending.some((pendingMessage) => pendingMessage.clientMessageId === message.clientMessageId)) {
    return state
  }

  return { pending: [...state.pending, message] }
}

export const ack = (state: OutboxState, clientMessageId: string): OutboxState => ({
  pending: state.pending.filter((pendingMessage) => pendingMessage.clientMessageId !== clientMessageId)
})

export const pending = (state: OutboxState): ChatMessageView[] => state.pending
