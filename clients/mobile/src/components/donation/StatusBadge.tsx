import React from 'react'
import { StyleProp, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { STATUS, StatusType } from '../../donationWorkflow/types'
import Badge from '../badge'

export interface StatusBadgeProps {
  status: StatusType;
}

interface StatusStyles {
  container: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const theme = useTheme()
  const statusStyles = getStatusStyles(status, theme)

  return (
      <Badge
          text={status}
          containerStyle={statusStyles.container}
          textStyle={statusStyles.text}
      />
  )
}

const getStatusStyles = (status: StatusType, theme: Theme): StatusStyles => {
  switch (status.toUpperCase()) {
    case STATUS.ACCEPTED:
      return {
        container: { backgroundColor: theme.colors.secondary },
        text: { color: theme.colors.white }
      }
    case STATUS.IGNORED:
      return {
        container: { backgroundColor: theme.colors.redFaded },
        text: { color: theme.colors.white }
      }
    case STATUS.PENDING:
      return {
        container: { backgroundColor: theme.colors.greyBG },
        text: { color: theme.colors.textPrimary }
      }
    case STATUS.CANCELLED:
      return {
        container: { backgroundColor: theme.colors.darkAmber },
        text: { color: theme.colors.textPrimary }
      }
    case STATUS.EXPIRED:
      return {
        container: { backgroundColor: theme.colors.extraLightGray },
        text: { color: theme.colors.textPrimary }
      }
    case STATUS.MANAGED:
      return {
        container: { backgroundColor: theme.colors.secondary },
        text: { color: theme.colors.textPrimary }
      }
    case STATUS.COMPLETED:
      return {
        container: { backgroundColor: theme.colors.primary },
        text: { color: theme.colors.white }
      }
    default:
      return {
        container: { backgroundColor: theme.colors.grey },
        text: { color: theme.colors.textSecondary }
      }
  }
}

export default StatusBadge
