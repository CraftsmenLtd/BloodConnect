import React from 'react'
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native'

const MAX_LENGTH = 2000

export const MessageComposer = (
  { onSend, onTyping, disabled }: { onSend: (body: string) => void; onTyping?: () => void; disabled?: boolean }
): React.ReactElement => {
  const [text, setText] = React.useState('')
  const trimmed = text.trim()
  const canSend = disabled !== true && trimmed.length > 0 && trimmed.length <= MAX_LENGTH

  const handleSend = (): void => {
    if (canSend) {
      onSend(trimmed)
      setText('')
    }
  }

  const handleChange = (value: string): void => {
    setText(value)
    onTyping?.()
  }

  return (
    <View style={styles.row}>
      <TextInput
        testID="chat-room-composer-input"
        style={styles.input}
        value={text}
        editable={disabled !== true}
        maxLength={MAX_LENGTH}
        onChangeText={handleChange}
        placeholder="Message"
      />
      <Pressable
        testID="chat-room-send-button"
        disabled={!canSend}
        onPress={handleSend}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Send</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', borderTopColor: '#EEEEEE', borderTopWidth: 1, flexDirection: 'row', padding: 8 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 20, flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  button: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: '#D32F2F', fontWeight: '600' }
})
