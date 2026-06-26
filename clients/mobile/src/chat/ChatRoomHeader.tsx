import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import { formattedDate } from '../utility/formatting'
import type { ChatContextSnapshot } from './chatTypes'

type ChatRoomHeaderProps = {
  context: ChatContextSnapshot;
}

// Renders the request context snapshotted onto the channel at creation, so the header shows on a
// cold-start deep-link without fetching the donation post.
const ChatRoomHeader = ({ context }: ChatRoomHeaderProps) => {
  const styles = createStyles(useTheme())

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.bloodGroup}>{context.requestedBloodGroup}</Text>
        <Text style={styles.urgency}>{context.urgencyLevel}</Text>
      </View>
      <Text style={styles.detail}>{context.location}</Text>
      <Text style={styles.detail}>{formattedDate(context.donationDateTime)}</Text>
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.extraLightGray
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  bloodGroup: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  urgency: {
    fontSize: 13,
    textTransform: 'capitalize',
    color: theme.colors.textSecondary
  },
  detail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2
  }
})

export default ChatRoomHeader
