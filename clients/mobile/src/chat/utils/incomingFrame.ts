import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import { MESSAGE_RETENTION_SECONDS, MILLISECONDS_PER_SECOND } from '../constants/chatConstants'

const CHAT_MESSAGE_FRAME = 'CHAT_MESSAGE'

type IncomingFrame = {
  type?: unknown;
  channelId?: unknown;
  messageId?: unknown;
  senderId?: unknown;
  text?: unknown;
  createdAt?: unknown;
}

const isChatMessageFrame = (frame: IncomingFrame): boolean =>
  frame.type === CHAT_MESSAGE_FRAME
  && typeof frame.channelId === 'string'
  && typeof frame.messageId === 'string'
  && typeof frame.senderId === 'string'
  && typeof frame.text === 'string'
  && typeof frame.createdAt === 'string'

// The server frame (sendChatMessage.buildFrame) omits expiresAt, so derive it locally
// from the message timestamp to satisfy the ChatMessageDTO shape used by the cache.
export const frameToMessage = (data: unknown): ChatMessageDTO | null => {
  if (typeof data !== 'object' || data === null) {
    return null
  }
  const frame = data as IncomingFrame
  if (!isChatMessageFrame(frame)) {
    return null
  }
  const createdAt = frame.createdAt as string
  const createdAtSeconds = Math.floor(Date.parse(createdAt) / MILLISECONDS_PER_SECOND)

  return {
    channelId: frame.channelId as string,
    messageId: frame.messageId as string,
    senderId: frame.senderId as string,
    text: frame.text as string,
    createdAt,
    expiresAt: createdAtSeconds + MESSAGE_RETENTION_SECONDS
  }
}
