import React from 'react'
import { Animated, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { spacing, radius } from '../../setup/theme/tokens'

type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  toastAnimationFinished: Animated.Value;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', toastAnimationFinished }) => {
  const styles = createStyles(useTheme(), type, toastAnimationFinished)

  return (
    <Animated.View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

const createStyles = (theme: Theme, type: string, opacity: Animated.Value): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: type === 'success' ? theme.colors.primary : type === 'error' ? theme.colors.surfaceVariant : theme.colors.textTertiary,
    opacity
  },
  text: {
    color: theme.colors.onPrimary,
    textAlign: 'center'
  }
})

export default Toast
