import { StyleSheet } from 'react-native'
import type { Theme } from '../../setup/theme'
import { spacing } from '../../setup/theme/tokens'

export const commonStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  inputContainer: {
    marginBottom: spacing.md
  },
  label: {
    fontSize: theme.typography.fontSize,
    marginBottom: spacing.xs,
    color: theme.colors.textSecondary,
    fontWeight: '500'
  },
  error: {
    color: theme.colors.primary,
    fontSize: theme.typography.errorFontSize
  },
  asterisk: {
    color: theme.colors.primary
  },
  inputFocused: {
    borderColor: theme.colors.focus
  },
  inputError: {
    borderColor: theme.colors.primary
  },
  inputDisabled: {
    backgroundColor: theme.colors.surfaceVariant,
    opacity: 0.6
  }
})
