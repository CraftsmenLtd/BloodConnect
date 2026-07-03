import React from 'react'
import type {
  KeyboardTypeOptions,
  StyleProp,
  ViewStyle
} from 'react-native'
import {
  View,
  TextInput,
  StyleSheet
} from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'
import type { InputProps } from './types'
import { spacing, radius } from '../../setup/theme/tokens'

type InputElementProps = {
  keyboardType?: KeyboardTypeOptions;
  readOnly?: boolean;
  inputStyle?: StyleProp<ViewStyle>;
} & InputProps

export const Input = ({
  name,
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  isRequired = false,
  readOnly = false,
  inputStyle
}: InputElementProps): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={(text) => { onChangeText(name, text) }}
        keyboardType={keyboardType}
        editable={!readOnly}
      />
      {error !== null && error !== undefined && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    width: '100%',
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface
  }
})
