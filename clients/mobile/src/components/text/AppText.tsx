import React, { forwardRef } from 'react'
import { Text as RNText } from 'react-native'
import type { Text as RNTextRef, TextProps } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'

export const Text = forwardRef<RNTextRef, TextProps>(({ style, ...props }, ref) => {
  const theme = useTheme()

  return <RNText ref={ref} style={[{ color: theme.colors.textPrimary }, style]} {...props} />
})

Text.displayName = 'Text'

export default Text
