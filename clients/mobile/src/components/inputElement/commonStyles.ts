import { StyleSheet } from 'react-native'
import { Theme } from '../../setup/theme'

export const commonStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  inputContainer: {
    marginBottom: 10
  },
  label: {
    fontSize: theme.typography.fontSize,
    marginBottom: 5
  },
  error: {
    color: theme.colors.primary,
    fontSize: theme.typography.errorFontSize
  },
  asterisk: {
    color: theme.colors.primary
  }
})
