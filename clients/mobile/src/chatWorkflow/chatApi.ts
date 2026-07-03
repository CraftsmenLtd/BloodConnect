import type { InboundMessage, ChannelSummary } from './types'

export type ChatApiClient = {
  get: <T>(path: string) => Promise<T>;
}

export type HistoryPage = {
  items: InboundMessage[];
  nextCursor: string | null;
}

export type ChannelsPage = {
  items: ChannelSummary[];
  nextCursor: string | null;
}

export const buildQuery = (params: Record<string, string | undefined>): string => {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''
  )
  if (entries.length === 0) {
    return ''
  }

  return `?${entries
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')}`
}

export const fetchHistory = async (
  client: ChatApiClient,
  channelId: string,
  cursor?: string
): Promise<HistoryPage> => {
  const response = await client.get<{ data: HistoryPage }>(
    `/chat/history${buildQuery({ channelId, cursor })}`
  )

  return response.data
}

export const fetchChannels = async (
  client: ChatApiClient,
  cursor?: string
): Promise<ChannelsPage> => {
  const response = await client.get<{ data: ChannelsPage }>(
    `/chat/channels${buildQuery({ cursor })}`
  )

  return response.data
}
