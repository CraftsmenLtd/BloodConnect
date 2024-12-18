import React from 'react'
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { StatusType } from '../../donationWorkflow/types'

export interface StatusBadgeProps {
  status: StatusType;
}

interface StatusStyles {
  container: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const statusStyles = getStatusStyles(status, theme)

  return (
    <View style={[styles.badge, statusStyles.container]}>
      <Text style={[styles.text, statusStyles.text]}>{status}</Text>
    </View>
  )
}

const getStatusStyles = (status: StatusType, theme: Theme): StatusStyles => {
  switch (status.toUpperCase()) {
    case 'ACCEPTED':
      return {
        container: { backgroundColor: theme.colors.secondary },
        text: { color: theme.colors.white }
      }
    case 'IGNORE':
      return {
        container: { backgroundColor: theme.colors.redFaded },
        text: { color: theme.colors.white }
      }
    case 'PENDING':
      return {
        container: { backgroundColor: theme.colors.goldenYellow },
        text: { color: theme.colors.textPrimary }
      }
    default:
      return {
        container: { backgroundColor: theme.colors.grey },
        text: { color: theme.colors.textSecondary }
      }
  }
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold'
  }
})

export default StatusBadge
