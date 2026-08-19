import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { FontAwesome } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import type { InputProps } from './types'
import { commonStyles } from './commonStyles'
import useFieldFocus from './hooks/useFieldFocus'
import type { Dispatch, SetStateAction } from 'react'
import { spacing, radius } from '../../setup/theme/tokens'

type PasswordInputProps = {
  isVisible: boolean;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
} & Omit<InputProps, 'placeholder'>

export const PasswordInput = ({ name, label, value, onChangeText, isVisible, setIsVisible, error }: PasswordInputProps) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { isFocused, handleFocus, handleBlur } = useFieldFocus()
  const hasError = error !== null && error !== undefined && error !== ''

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.passwordContainer,
        isFocused && styles.inputFocused,
        hasError && styles.inputError
      ]}>
        <TextInput
          style={styles.passwordInput}
          placeholder="**********"
          placeholderTextColor={theme.colors.textTertiary}
          selectionColor={theme.colors.focus}
          cursorColor={theme.colors.focus}
          secureTextEntry={!isVisible}
          value={value}
          onChangeText={(text) => { onChangeText(name, text) }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <TouchableOpacity onPress={() => { setIsVisible((prevState) => !prevState) }} style={styles.eyeIcon}>
          <FontAwesome name={isVisible ? 'eye' : 'eye-slash'} size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </View>
      {error !== null && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.colors.surface
  },
  passwordInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: theme.colors.textPrimary
  },
  eyeIcon: {
    padding: spacing.md
  }
})
