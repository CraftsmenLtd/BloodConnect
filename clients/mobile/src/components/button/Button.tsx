import React from 'react'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import Loader from '../loaders/loader'
import { spacing, radius } from '../../setup/theme/tokens'

type ButtonProps = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button = ({ text, onPress, buttonStyle, textStyle, loading = false, disabled = false }: ButtonProps) => {
  const styles = createStyles(useTheme())
  const isDisabled = disabled || loading

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        buttonStyle,
        disabled && styles.disabledButton,
        pressed && !isDisabled && styles.pressed
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <View style={styles.buttonContent}>
        {loading && <View style={styles.loaderOverlay}><Loader size='small' /></View>}
        <Text style={[styles.buttonText, textStyle, disabled && styles.disabledText]}>{text}</Text>
      </View>
    </Pressable>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: spacing.lg,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md
    },
    buttonContent: {
      position: 'relative'
    },
    loaderOverlay: {
      position: 'absolute',
      left: 50
    },
    buttonText: {
      color: theme.colors.onPrimary,
      fontWeight: 'bold',
      fontSize: theme.typography.fontSize
    },
    disabledButton: {
      backgroundColor: theme.colors.surfaceVariant
    },
    disabledText: {
      color: theme.colors.textTertiary
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }]
    }
  })

export default Button
