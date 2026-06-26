import { useTranslation } from 'react-i18next'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet
} from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { useChatInbox } from '../hooks/useChatInbox'
import type { ChatChannelSummary } from '../types'

const ChatInbox = (): JSX.Element => {
  const theme = useTheme()
  const { t } = useTranslation()
  const styles = createStyles(theme)
  const { channels, loading, errorMessage, refreshing, handleRefresh, openChat } = useChatInbox()

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  const renderItem = ({ item }: { item: ChatChannelSummary }): JSX.Element => (
    <TouchableOpacity style={styles.row} onPress={() => openChat(item)}>
      <View style={styles.rowContent}>
        <Text style={styles.title} numberOfLines={1}>
          {item.requestedBloodGroup !== undefined && item.requestedBloodGroup !== ''
            ? `${t('chat.bloodRequest')} · ${item.requestedBloodGroup}`
            : t('chat.bloodRequest')}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {item.lastMessagePreview ?? ''}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {errorMessage !== null && <Text style={styles.error}>{errorMessage}</Text>}
      <FlatList
        data={channels}
        keyExtractor={(item) => item.channelId}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>{t('chat.emptyInbox')}</Text>}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.white },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.extraLightGray
    },
    rowContent: { flex: 1 },
    title: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
    preview: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8
    },
    badgeText: { color: theme.colors.white, fontSize: 12, fontWeight: '600' },
    empty: { textAlign: 'center', marginTop: 40, color: theme.colors.textSecondary },
    error: { color: theme.colors.bloodRed, padding: 12, textAlign: 'center' }
  })

export default ChatInbox
