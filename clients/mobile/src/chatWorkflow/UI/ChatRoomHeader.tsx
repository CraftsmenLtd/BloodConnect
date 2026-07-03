import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { ChannelContext } from '../types'

export const ChatRoomHeader = (
  { context }: { context?: ChannelContext }
): React.ReactElement | null =>
  context === undefined
    ? null
    : (
      <View testID="chat-room-header" style={styles.header}>
        <Text style={styles.title}>
          {context.requestedBloodGroup} · {context.urgencyLevel}
        </Text>
        <Text style={styles.subtitle}>
          {context.donationDateTime} · {context.location}
        </Text>
      </View>
    )

const styles = StyleSheet.create({
  header: { backgroundColor: '#FAFAFA', borderBottomColor: '#EEEEEE', borderBottomWidth: 1, padding: 12 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { color: '#888888', fontSize: 12, marginTop: 2 }
})
