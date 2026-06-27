import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import type { ListRenderItem } from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import type { ChatRoomRouteProp } from '../setup/navigation/navigationTypes'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { useUserProfile } from '../userWorkflow/context/UserProfileContext'
import { useChat } from './context/ChatProvider'
import { mergeMessages, useChatMessages } from './hooks/useChatMessages'
import { useChatRoomConnection } from './hooks/useChatRoomConnection'
import { markChannelRead } from './services/chatService'
import { generateMessageId } from './utils/messageId'
import { MESSAGE_RETENTION_SECONDS, MILLISECONDS_PER_SECOND } from './constants/chatConstants'
import ChatRoomHeader from './ChatRoomHeader'
import type { ChatMessageDTO } from '../../../../commons/dto/ChatDTO'

type RoomStyles = ReturnType<typeof createStyles>

type ChatMessageBubbleProps = {
  message: ChatMessageDTO;
  isOwn: boolean;
  styles: RoomStyles;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isOwn, styles }) => (
  <View
    style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}
    testID={`chat-message-${message.messageId}`}
  >
    <View
      style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
      testID={isOwn ? 'chat-message-sent' : 'chat-message-received'}
    >
      <Text style={isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther}>{message.text}</Text>
    </View>
  </View>
)

const ChatLockedBanner: React.FC<{ styles: RoomStyles }> = ({ styles }) => (
  <View style={styles.lockedBanner} testID="chat-locked-banner">
    <Text style={styles.lockedText}>This conversation is closed. You can no longer send messages.</Text>
  </View>
)

type ChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholderColor: string;
  styles: RoomStyles;
}

const ChatComposer: React.FC<ChatComposerProps> = ({ value, onChangeText, onSend, placeholderColor, styles }) => (
  <View style={styles.composer} testID="chat-composer">
    <TextInput
      style={styles.composerInput}
      value={value}
      onChangeText={onChangeText}
      placeholder="Type a message"
      placeholderTextColor={placeholderColor}
      multiline
      testID="chat-composer-input"
    />
    <TouchableOpacity
      style={[styles.sendButton, value.trim() === '' && styles.sendButtonDisabled]}
      onPress={onSend}
      disabled={value.trim() === ''}
      testID="chat-composer-send"
    >
      <Text style={styles.sendButtonText}>Send</Text>
    </TouchableOpacity>
  </View>
)

const buildOptimisticMessage = (channelId: string, senderId: string, text: string): ChatMessageDTO => {
  const createdAt = new Date().toISOString()
  const createdAtSeconds = Math.floor(Date.parse(createdAt) / MILLISECONDS_PER_SECOND)

  return {
    channelId,
    messageId: generateMessageId(),
    senderId,
    text,
    createdAt,
    expiresAt: createdAtSeconds + MESSAGE_RETENTION_SECONDS
  }
}

const ChatRoomScreen: React.FC = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { channelId, requestPostId, bloodGroup } = useRoute<ChatRoomRouteProp>().params
  const httpClient = useFetchClient()
  const { userProfile } = useUserProfile()
  const { channels, messagesByChannel, upsertMessages, setUnreadCount } = useChat()
  const { messages: history, loadMore } = useChatMessages(channelId, httpClient)
  const [draft, setDraft] = useState<string>('')

  // Inbound WebSocket frames land in the shared cache keyed by their own channelId.
  const onIncoming = useCallback(
    (message: ChatMessageDTO): void => { upsertMessages(message.channelId, [message]) },
    [upsertMessages]
  )
  const { sendOrQueue } = useChatRoomConnection(httpClient, onIncoming)

  useEffect(() => {
    void loadMore()
    // loadMore guards against duplicate/over-fetching internally; reload on channel change only.
  }, [channelId])

  // Opening the room clears its badge: clear the local count immediately, then reset the
  // server-side pointer (caller's only) so the inbox stays accurate across reloads (ADV-003).
  useFocusEffect(
    useCallback(() => {
      setUnreadCount(channelId, 0)
      void markChannelRead(channelId, httpClient).catch(() => undefined)
    }, [channelId, httpClient, setUnreadCount])
  )

  const channel = channels.find((item) => item.channelId === channelId)
  const isLocked = channel?.status === 'LOCKED'
  const messages = mergeMessages(history, messagesByChannel[channelId] ?? [])

  const handleSend = useCallback((): void => {
    const trimmed = draft.trim()
    if (trimmed === '') {
      return
    }
    const optimistic = buildOptimisticMessage(channelId, userProfile.userId, trimmed)
    upsertMessages(channelId, [optimistic])
    setDraft('')
    const outgoing = { channelId, messageId: optimistic.messageId, text: trimmed, createdAt: optimistic.createdAt }
    void sendOrQueue(outgoing).catch(() => undefined)
  }, [draft, channelId, userProfile.userId, upsertMessages, sendOrQueue])

  const renderItem: ListRenderItem<ChatMessageDTO> = ({ item }) => (
    <ChatMessageBubble message={item} isOwn={item.senderId === userProfile.userId} styles={styles} />
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="chat-room-screen"
    >
      <ChatRoomHeader channel={channel} bloodGroup={bloodGroup} requestPostId={requestPostId} />
      <FlatList
        data={messages}
        keyExtractor={(item) => item.messageId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet</Text>}
      />
      {isLocked
        ? <ChatLockedBanner styles={styles} />
        : <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          placeholderColor={theme.colors.textSecondary}
          styles={styles}
        />}
    </KeyboardAvoidingView>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 4
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end'
  },
  bubbleRowOther: {
    justifyContent: 'flex-start'
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16
  },
  bubbleOwn: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4
  },
  bubbleOther: {
    backgroundColor: theme.colors.extraLightGray,
    borderBottomLeftRadius: 4
  },
  bubbleTextOwn: {
    fontSize: 15,
    color: theme.colors.white
  },
  bubbleTextOther: {
    fontSize: 15,
    color: theme.colors.textPrimary
  },
  empty: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    color: theme.colors.textSecondary
  },
  lockedBanner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.extraLightGray,
    borderTopColor: theme.colors.extraLightGray,
    borderTopWidth: 1
  },
  lockedText: {
    fontSize: 13,
    textAlign: 'center',
    color: theme.colors.textSecondary
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopColor: theme.colors.extraLightGray,
    borderTopWidth: 1,
    backgroundColor: theme.colors.white
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    fontSize: 15,
    color: theme.colors.textPrimary
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.lightGrey
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white
  }
})

export default ChatRoomScreen
