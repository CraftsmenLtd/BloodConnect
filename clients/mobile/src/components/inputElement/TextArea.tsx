import React from 'react'
import { View, TextInput, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'

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
  const styles = createStyles(useTheme())

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
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
    borderColor: theme.colors.extraLightGray,
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: 'top'
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
