import type { ChatMessageView } from './types'

const sortKey = (message: ChatMessageView): string =>
  `${message.sentAt}#${message.messageId ?? message.clientMessageId}`

export const upsertMessage = (
  messages: ChatMessageView[],
  incoming: ChatMessageView
): ChatMessageView[] => {
  const withoutDuplicate = messages.filter(
    (message) =>
      message.clientMessageId !== incoming.clientMessageId
      && (incoming.messageId === undefined || message.messageId !== incoming.messageId)
  )

  return [...withoutDuplicate, incoming].sort((left, right) =>
    sortKey(left) < sortKey(right) ? -1 : 1
  )
}

export const mergeOlder = (
  messages: ChatMessageView[],
  older: ChatMessageView[]
): ChatMessageView[] => older.reduce((accumulator, message) => upsertMessage(accumulator, message), messages)

export const unreadCount = (
  messages: ChatMessageView[],
  myUserId: string,
  lastReadAt: string | undefined
): number =>
  messages.filter(
    (message) =>
      message.senderId !== myUserId
      && (lastReadAt === undefined || message.sentAt > lastReadAt)
  ).length
