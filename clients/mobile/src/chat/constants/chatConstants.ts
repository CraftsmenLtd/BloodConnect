export const CHAT_OUTBOX_STORAGE_KEY = 'chatOutbox'

// channelId encodes the chat triple as `<seekerId>#<requestPostId>#<donorId>` (architecture, Data model).
export const CHANNEL_ID_SEPARATOR = '#'

export const buildChannelId = (seekerId: string, requestPostId: string, donorId: string): string =>
  [seekerId, requestPostId, donorId].join(CHANNEL_ID_SEPARATOR)

export const DEFAULT_RECONNECT_DELAY_MS = 3000

export const CHAT_HISTORY_PAGE_SIZE = 30

export const WEBSOCKET_OPEN = 1

export const MILLISECONDS_PER_SECOND = 1000

// 90-day message retention window (in seconds) used to stamp optimistic local messages.
export const MESSAGE_RETENTION_SECONDS = 7_776_000
