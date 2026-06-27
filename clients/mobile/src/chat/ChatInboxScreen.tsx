import React, { useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import type { ListRenderItem } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import { SCREENS } from '../setup/constant/screens'
import type { RootStackParamList } from '../setup/navigation/navigationTypes'
import { useUserProfile } from '../userWorkflow/context/UserProfileContext'
import { useChat } from './context/ChatProvider'
import type { ChatChannelDTO } from '../../../../commons/dto/ChatDTO'

type InboxNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.CHAT_INBOX>

const resolveOtherPartyLabel = (channel: ChatChannelDTO, currentUserId: string): string =>
  channel.seekerId === currentUserId ? 'Donor' : 'Seeker'

type ChatInboxRowProps = {
  channel: ChatChannelDTO;
  unreadCount: number;
  otherPartyLabel: string;
  onPress: (channel: ChatChannelDTO) => void;
  styles: ReturnType<typeof createStyles>;
}

const ChatInboxRow: React.FC<ChatInboxRowProps> = ({ channel, unreadCount, otherPartyLabel, onPress, styles }) => (
  <TouchableOpacity style={styles.row} onPress={() => onPress(channel)} testID={`chat-inbox-row-${channel.channelId}`}>
    <View style={styles.rowBody}>
      <Text style={styles.partyName} numberOfLines={1}>{otherPartyLabel}</Text>
      <Text style={styles.preview} numberOfLines={1} ellipsizeMode="tail">
        {channel.lastMessagePreview ?? 'No messages yet'}
      </Text>
    </View>
    {unreadCount > 0 && (
      <View style={styles.unreadBadge} testID={`chat-inbox-unread-${channel.channelId}`}>
        <Text style={styles.unreadText}>{unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
)

const ChatInboxScreen: React.FC = () => {
  const styles = createStyles(useTheme())
  const navigation = useNavigation<InboxNavigationProp>()
  const { channels, unreadByChannel } = useChat()
  const { userProfile } = useUserProfile()

  const openRoom = useCallback((channel: ChatChannelDTO): void => {
    navigation.navigate(SCREENS.CHAT_ROOM, { channelId: channel.channelId, requestPostId: channel.requestPostId })
  }, [navigation])

  const renderItem: ListRenderItem<ChatChannelDTO> = ({ item }) => (
    <ChatInboxRow
      channel={item}
      unreadCount={unreadByChannel[item.channelId] ?? item.unreadCount ?? 0}
      otherPartyLabel={resolveOtherPartyLabel(item, userProfile.userId)}
      onPress={openRoom}
      styles={styles}
    />
  )

  return (
    <View style={styles.container} testID="chat-inbox-screen">
      <FlatList
        data={channels}
        keyExtractor={(item) => item.channelId}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet</Text>}
        contentContainerStyle={channels.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomColor: theme.colors.extraLightGray,
    borderBottomWidth: 1
  },
  rowBody: {
    flex: 1,
    marginRight: 12
  },
  partyName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary
  },
  preview: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.white
  },
  empty: {
    fontSize: 14,
    color: theme.colors.textSecondary
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default ChatInboxScreen
