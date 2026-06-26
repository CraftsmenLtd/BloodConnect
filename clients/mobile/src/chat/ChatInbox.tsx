import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import { SCREENS } from '../setup/constant/screens'
import type { ChatInboxNavigationProp } from '../setup/navigation/navigationTypes'
import StateAwareRenderer from '../components/StateAwareRenderer'
import { formattedDate } from '../utility/formatting'
import { ChatRole } from '../../../../commons/dto/ChatDTO'
import { useChatInbox } from './useChatInbox'
import type { ChatInboxItem } from './chatTypes'

// The caller chats with the opposite participant: a seeker's channels are with donors and vice versa.
const counterpartLabel = (role: ChatInboxItem['role']): string =>
  (role === ChatRole.SEEKER ? 'Chat with donor' : 'Chat with seeker')

const ChatInbox = () => {
  const styles = createStyles(useTheme())
  const navigation = useNavigation<ChatInboxNavigationProp>()
  const { channels, loading, error, refresh, markRead } = useChatInbox()

  const openChannel = (channel: ChatInboxItem): void => {
    if (channel.unread) void markRead(channel.channelId)
    navigation.navigate(SCREENS.CHAT_ROOM, { channelId: channel.channelId })
  }

  const ViewToRender = () =>
    <FlatList
      data={channels}
      keyExtractor={(item) => item.channelId}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => { void refresh() }} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => { openChannel(item) }}>
          <View style={styles.rowText}>
            <Text style={[styles.title, item.unread && styles.titleUnread]}>
              {counterpartLabel(item.role)}
            </Text>
            {item.lastMessageAt !== undefined && (
              <Text style={styles.subtitle}>{formattedDate(item.lastMessageAt)}</Text>
            )}
          </View>
          {item.unread && <View style={styles.unreadBadge} testID="unread-badge" />}
        </TouchableOpacity>
      )}
    />

  return (
    <View style={styles.container}>
      <StateAwareRenderer
        loading={loading && channels.length === 0}
        errorMessage={error}
        data={channels}
        showEmptyMessageForEmptyArray={false}
        ViewComponent={ViewToRender}
      />
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  list: {
    flexGrow: 1
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.extraLightGray
  },
  rowText: {
    flex: 1
  },
  title: {
    fontSize: 16,
    color: theme.colors.textPrimary
  },
  titleUnread: {
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4
  },
  unreadBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginLeft: 12
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.grey
  }
})

export default ChatInbox
