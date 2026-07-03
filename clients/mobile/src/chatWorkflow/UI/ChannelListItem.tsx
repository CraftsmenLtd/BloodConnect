import React from 'react'
import { Pressable, View, Text, StyleSheet } from 'react-native'
import type { ChannelSummary } from '../types'

export const ChannelListItem = (
  { channel, onPress }: { channel: ChannelSummary; onPress: (channelId: string) => void }
): React.ReactElement => (
  <Pressable
    testID={`chat-inbox-item-${channel.channelId}`}
    onPress={() => onPress(channel.channelId)}
    style={styles.item}
  >
    <View style={styles.row}>
      <Text style={styles.title}>{channel.context?.requestedBloodGroup ?? 'Chat'}</Text>
      {channel.unreadCount !== undefined && channel.unreadCount > 0
        ? (
          <View testID={`chat-inbox-unread-${channel.channelId}`} style={styles.badge}>
            <Text style={styles.badgeText}>{channel.unreadCount}</Text>
          </View>
        )
        : null}
    </View>
    <Text numberOfLines={1} style={styles.preview}>{channel.lastMessagePreview ?? ''}</Text>
  </Pressable>
)

const styles = StyleSheet.create({
  item: { borderBottomColor: '#EEEEEE', borderBottomWidth: 1, padding: 12 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '600' },
  badge: { backgroundColor: '#D32F2F', borderRadius: 10, minWidth: 20, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 12, textAlign: 'center' },
  preview: { color: '#888888', marginTop: 4 }
})
