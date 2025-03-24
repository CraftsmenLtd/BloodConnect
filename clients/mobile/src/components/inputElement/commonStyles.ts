import { StyleSheet } from 'react-native'
import type { Theme } from '../../setup/theme'

export const commonStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  inputContainer: {
    marginBottom: 10
  },
  label: {
    fontSize: theme.typography.fontSize,
    marginBottom: 5,
    color: theme.colors.darkGrey,
    fontWeight: '500'
  },
  error: {
    color: theme.colors.primary,
    fontSize: theme.typography.errorFontSize
  },
  asterisk: {
    color: theme.colors.primary
  }
})
