import type { ChatInboxItem, ChatMembershipDTO } from './chatTypes'

// Unread is derived client-side: a channel is unread when it has activity newer than the caller's
// own lastReadAt marker (ISO timestamps sort lexicographically). Not a read receipt.
export const isUnread = (lastMessageAt?: string, lastReadAt?: string): boolean => {
  if (lastMessageAt === undefined || lastMessageAt === '') return false
  if (lastReadAt === undefined || lastReadAt === '') return true

  return lastMessageAt > lastReadAt
}

export const toInboxItem = (membership: ChatMembershipDTO): ChatInboxItem => ({
  channelId: membership.channelId,
  role: membership.role,
  lastMessageAt: membership.lastMessageAt,
  lastReadAt: membership.lastReadAt,
  unread: isUnread(membership.lastMessageAt, membership.lastReadAt)
})
