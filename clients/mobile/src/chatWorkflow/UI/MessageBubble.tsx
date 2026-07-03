import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { ChatMessageView } from '../types'

export const MessageBubble = (
  { message, isMine }: { message: ChatMessageView; isMine: boolean }
): React.ReactElement => (
  <View
    testID={`chat-room-message-${message.messageId ?? message.clientMessageId}`}
    style={[styles.bubble, isMine ? styles.mine : styles.theirs]}
  >
    <Text style={styles.body}>{message.body}</Text>
    {isMine ? <Text style={styles.status}>{message.status}</Text> : null}
  </View>
)

const styles = StyleSheet.create({
  bubble: { borderRadius: 12, marginHorizontal: 12, marginVertical: 4, maxWidth: '80%', padding: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#FFE0E0' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#EEEEEE' },
  body: { fontSize: 15 },
  status: { alignSelf: 'flex-end', color: '#888888', fontSize: 10, marginTop: 2 }
})
