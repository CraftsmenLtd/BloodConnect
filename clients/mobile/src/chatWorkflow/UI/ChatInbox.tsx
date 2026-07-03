import React from 'react'
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useChatInbox } from '../hooks/useChatInbox'
import type { ChatApiClient } from '../chatApi'
import { ChannelListItem } from './ChannelListItem'

export const ChatInbox = (
  { apiClient, onOpenChannel }: { apiClient: ChatApiClient; onOpenChannel: (channelId: string) => void }
): React.ReactElement => {
  const { channels, isLoading, error } = useChatInbox(apiClient)

  if (isLoading) {
    return <ActivityIndicator testID="chat-inbox-loading" style={styles.loader} />
  }

  return (
    <View style={styles.container}>
      {error !== '' ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        testID="chat-inbox-list"
        data={channels}
        keyExtractor={(item) => item.channelId}
        renderItem={({ item }) => <ChannelListItem channel={item} onPress={onOpenChannel} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 24 },
  error: { color: '#D32F2F', padding: 12 }
})
