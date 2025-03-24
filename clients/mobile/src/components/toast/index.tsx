import React from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'

interface ToastProps {
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
    padding: 16,
    borderRadius: 8,
    backgroundColor: type === 'success' ? theme.colors.primary : type === 'error' ? theme.colors.greyBG : theme.colors.grey,
    opacity
  },
  text: {
    color: theme.colors.white,
    textAlign: 'center'
  }
})

export default Toast
