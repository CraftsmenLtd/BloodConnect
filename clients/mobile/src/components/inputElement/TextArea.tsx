import React from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'
import { spacing, radius } from '../../setup/theme/tokens'

type TextAreaProps = {
  name: string;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (name: string | undefined, text: string) => void;
  maxLength: number;
  error?: string | null;
}

export const TextArea = ({ name, label, value, placeholder, onChangeText, maxLength, error }: TextAreaProps) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        style={styles.textArea}
        value={value}
        onChangeText={(text) => { onChangeText(name, text) }}
        multiline
        maxLength={maxLength}
      />
      <View style={[styles.charCountContainer, { justifyContent: error !== null ? 'space-between' : 'flex-end' }]}>
        {error !== null && <Text style={[styles.error, { flexShrink: 1 }]}>{error}</Text>}
        <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
      </View>
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    height: 100,
    textAlignVertical: 'top',
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface
  },
  charCountContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  charCount: {
    textAlign: 'right',
    color: theme.colors.textSecondary
  }
})
