import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { SCREENS } from '../../setup/constant/screens'
import type { ChatInboxNavigationProp } from '../../setup/navigation/navigationTypes'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { fetchChatInbox } from '../services/chatService'
import type { ChatChannelSummary } from '../types'

type UseChatInbox = {
  channels: ChatChannelSummary[];
  loading: boolean;
  errorMessage: string | null;
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
  openChat: (channel: ChatChannelSummary) => void;
}

export const useChatInbox = (): UseChatInbox => {
  const navigation = useNavigation<ChatInboxNavigationProp>()
  const fetchClient = useFetchClient()
  const [channels, setChannels] = useState<ChatChannelSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadInbox = useCallback(async(): Promise<void> => {
    try {
      setErrorMessage(null)
      const data = await fetchChatInbox(fetchClient)
      setChannels(data.channels)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load conversations.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fetchClient])

  useEffect(() => {
    void loadInbox()
  }, [loadInbox])

  const handleRefresh = useCallback(async(): Promise<void> => {
    setRefreshing(true)
    await loadInbox()
  }, [loadInbox])

  const openChat = useCallback(
    (channel: ChatChannelSummary): void => {
      navigation.navigate(SCREENS.CHAT_ROOM, {
        channelId: channel.channelId,
        requestedBloodGroup: channel.requestedBloodGroup
      })
    },
    [navigation]
  )

  return { channels, loading, errorMessage, refreshing, handleRefresh, openChat }
}
