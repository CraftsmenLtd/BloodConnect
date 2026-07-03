import { useCallback, useEffect, useState } from 'react'
import type { ChannelSummary } from '../types'
import type { ChatApiClient } from '../chatApi'
import { fetchChannels } from '../chatApi'

export type UseChatInboxResult = {
  channels: ChannelSummary[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

export const useChatInbox = (client: ChatApiClient): UseChatInboxResult => {
  const [channels, setChannels] = useState<ChannelSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const page = await fetchChannels(client)
      setChannels(page.items)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load chats')
    } finally {
      setIsLoading(false)
    }
  }, [client])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { channels, isLoading, error, refresh }
}
