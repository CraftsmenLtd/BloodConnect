import React, { useState } from 'react'
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
import { useRoute } from '@react-navigation/native'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import type { ChatRoomRouteProp } from '../setup/navigation/navigationTypes'
import { useUserProfile } from '../userWorkflow/context/UserProfileContext'
import StateAwareRenderer from '../components/StateAwareRenderer'
import { ChatChannelStatus } from './chatTypes'
import type { ChatMessageDTO } from './chatTypes'
import { useChatRoom } from './useChatRoom'
import ChatRoomHeader from './ChatRoomHeader'

const ChatRoom = () => {
  const styles = createStyles(useTheme())
  const { channelId } = useRoute<ChatRoomRouteProp>().params
  const { userProfile } = useUserProfile()
  const { messages, channel, loading, error, send } = useChatRoom(channelId)
  const [draft, setDraft] = useState('')

  // Only an explicitly OPEN channel accepts messages; a LOCKED channel shows a read-only banner and
  // an unknown (null) channel shows neither, so we never invite a send that would fail server-side.
  const isOpen = channel?.status === ChatChannelStatus.OPEN
  const isLocked = channel?.status === ChatChannelStatus.LOCKED

  const handleSend = (): void => {
    const content = draft.trim()
    if (content === '') return
    send(content)
    setDraft('')
  }

  const renderBubble = ({ item }: { item: ChatMessageDTO }) => {
    const isOwn = item.senderId === userProfile.userId

    return (
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={isOwn ? styles.bubbleTextOwn : styles.bubbleText}>{item.content}</Text>
      </View>
    )
  }

  const ViewToRender = () =>
    <FlatList
      data={messages}
      keyExtractor={(item) => item.messageId}
      renderItem={renderBubble}
      inverted
      contentContainerStyle={styles.messageList}
    />

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {channel !== null && <ChatRoomHeader context={channel.context} />}

      <View style={styles.body}>
        <StateAwareRenderer
          loading={loading && messages.length === 0}
          errorMessage={error}
          data={messages}
          ViewComponent={ViewToRender}
        />
      </View>

      {isLocked && <View style={styles.lockedBanner}>
        <Text style={styles.lockedText}>This conversation is closed. You can no longer send messages.</Text>
      </View>}

      {isOpen && <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, draft.trim() === '' && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={draft.trim() === ''}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>}
    </KeyboardAvoidingView>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  body: {
    flex: 1
  },
  messageList: {
    padding: 16,
    flexGrow: 1
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.greyBG
  },
  bubbleText: {
    color: theme.colors.textPrimary
  },
  bubbleTextOwn: {
    color: theme.colors.white
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.extraLightGray
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 20,
    color: theme.colors.textPrimary
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.primary
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendText: {
    color: theme.colors.white,
    fontWeight: 'bold'
  },
  lockedBanner: {
    padding: 16,
    backgroundColor: theme.colors.greyBG,
    borderTopWidth: 1,
    borderTopColor: theme.colors.extraLightGray
  },
  lockedText: {
    textAlign: 'center',
    color: theme.colors.textSecondary
  }
})

export default ChatRoom
