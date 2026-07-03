import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export const LockedBanner = (): React.ReactElement => (
  <View testID="chat-room-locked-banner" style={styles.banner}>
    <Text style={styles.text}>This chat is closed as the donation request is complete.</Text>
  </View>
)

const styles = StyleSheet.create({
  banner: { backgroundColor: '#F5F5F5', padding: 12 },
  text: { color: '#666666', textAlign: 'center' }
})
