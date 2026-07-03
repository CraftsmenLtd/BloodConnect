import React from 'react'
import { Text, StyleSheet } from 'react-native'

export const TypingIndicator = ({ visible }: { visible: boolean }): React.ReactElement | null =>
  visible
    ? (
      <Text testID="chat-room-typing" style={styles.text}>
        typing…
      </Text>
    )
    : null

const styles = StyleSheet.create({
  text: { color: '#888888', fontStyle: 'italic', paddingHorizontal: 12, paddingVertical: 4 }
})
