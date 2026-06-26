import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoute } from '@react-navigation/native'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import type { ChatRoomRouteProp } from '../../setup/navigation/navigationTypes'
import { useChatRoom } from '../hooks/useChatRoom'
import type { ChatMessage } from '../types'

const ChatRoom = (): JSX.Element => {
  const theme = useTheme()
  const { t } = useTranslation()
  const styles = createStyles(theme)
  const { params } = useRoute<ChatRoomRouteProp>()
  const [draft, setDraft] = useState<string>('')

  const { messages, loading, locked, currentUserId, sendMessage } = useChatRoom({
    channelId: params.channelId,
    initialLocked: params.locked
  })

  const handleSend = (): void => {
    sendMessage(draft)
    setDraft('')
  }

  const renderItem = ({ item }: { item: ChatMessage }): JSX.Element => {
    const isMine = item.senderId === currentUserId

    return (
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
          {item.content}
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerText} numberOfLines={1}>
          {params.requestedBloodGroup !== undefined && params.requestedBloodGroup !== ''
            ? `${t('chat.bloodRequest')} · ${params.requestedBloodGroup}`
            : t('chat.bloodRequest')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          inverted
          data={messages}
          keyExtractor={(item) => item.messageId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('chat.emptyConversation')}</Text>
          }
        />
      )}

      {locked ? (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>{t('chat.lockedBanner')}</Text>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor={theme.colors.grey}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, draft.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={draft.trim() === ''}
          >
            <Text style={styles.sendText}>{t('chat.send')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.white },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.extraLightGray,
      backgroundColor: theme.colors.greyBG
    },
    headerText: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    listContent: { paddingHorizontal: 12, paddingVertical: 8 },
    bubble: {
      maxWidth: '80%',
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginVertical: 4
    },
    bubbleMine: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary },
    bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: theme.colors.extraLightGray },
    bubbleTextMine: { color: theme.colors.white, fontSize: 15 },
    bubbleTextTheirs: { color: theme.colors.textPrimary, fontSize: 15 },
    empty: {
      textAlign: 'center',
      marginTop: 40,
      color: theme.colors.textSecondary,
      transform: [{ scaleY: -1 }]
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
      maxHeight: 120,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.greyBG,
      color: theme.colors.textPrimary
    },
    sendButton: {
      marginLeft: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center'
    },
    sendButtonDisabled: { backgroundColor: theme.colors.lightGrey },
    sendText: { color: theme.colors.white, fontWeight: '600' },
    lockedBanner: {
      padding: 14,
      backgroundColor: theme.colors.greyBG,
      borderTopWidth: 1,
      borderTopColor: theme.colors.extraLightGray
    },
    lockedText: { textAlign: 'center', color: theme.colors.textSecondary }
  })

export default ChatRoom
