import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import type { ChatChannelDTO } from '../../../../commons/dto/ChatDTO'

type ChatRoomHeaderProps = {
  channel?: ChatChannelDTO;
  bloodGroup?: string;
  requestPostId?: string;
}

const resolveRequestReference = (channel?: ChatChannelDTO, requestPostId?: string): string =>
  channel?.requestPostId ?? requestPostId ?? ''

const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({ channel, bloodGroup, requestPostId }) => {
  const styles = createStyles(useTheme())
  const reference = resolveRequestReference(channel, requestPostId)

  return (
    <View style={styles.container} testID="chat-room-header">
      <View style={styles.context}>
        {bloodGroup !== undefined && bloodGroup !== '' && (
          <View style={styles.bloodGroupBadge}>
            <Text style={styles.bloodGroupText} testID="chat-header-blood-group">{bloodGroup}</Text>
          </View>
        )}
        <View style={styles.referenceWrap}>
          <Text style={styles.title}>Blood request</Text>
          {reference !== '' && (
            <Text style={styles.reference} numberOfLines={1} ellipsizeMode="middle" testID="chat-header-reference">
              {`Ref: ${reference}`}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    borderBottomColor: theme.colors.extraLightGray,
    borderBottomWidth: 1
  },
  context: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bloodGroupBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
    backgroundColor: theme.colors.redFaded,
    marginRight: 12
  },
  bloodGroupText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.bloodRed
  },
  referenceWrap: {
    flex: 1
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary
  },
  reference: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2
  }
})

export default ChatRoomHeader
