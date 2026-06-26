import { useCallback, useEffect, useRef, useState } from 'react'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { fetchChatChannels, markChatRead } from './chatService'
import { isUnread, toInboxItem } from './chatHelpers'
import type { ChatInboxItem } from './chatTypes'

type UseChatInboxResult = {
  channels: ChatInboxItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (channelId: string) => Promise<void>;
}

// Lists the caller's chat channels and derives the unread indicator from lastMessageAt vs the
// caller's lastReadAt. markRead optimistically clears the badge by advancing the local lastReadAt.
export const useChatInbox = (): UseChatInboxResult => {
  // useFetchClient returns a fresh client each render, so hold it in a ref to keep the callbacks
  // stable (depending on its identity would re-fire the effect on every render).
  const fetchClient = useFetchClient()
  const fetchClientRef = useRef(fetchClient)
  fetchClientRef.current = fetchClient
  const [channels, setChannels] = useState<ChatInboxItem[]>([])
  const channelsRef = useRef(channels)
  channelsRef.current = channels
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async(): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchChatChannels(fetchClientRef.current)
      setChannels((response.data ?? []).map(toInboxItem))
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load chats.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const markRead = useCallback(async(channelId: string): Promise<void> => {
    const readAt = new Date().toISOString()
    const previousChannels = channelsRef.current
    setChannels((previous) => previous.map((channel) => (
      channel.channelId === channelId
        ? { ...channel, lastReadAt: readAt, unread: isUnread(channel.lastMessageAt, readAt) }
        : channel
    )))
    try {
      await markChatRead(channelId, fetchClientRef.current)
    } catch (markError) {
      // Roll back the optimistic badge clear so it does not falsely show read.
      setChannels(previousChannels)
      throw markError
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { channels, loading, error, refresh, markRead }
}
