import React, { forwardRef } from 'react'
import { StyleSheet, Text as RNText } from 'react-native'
import type { Text as RNTextRef, TextProps, TextStyle } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'

// Custom (non-system) fonts don't synthesize bold/medium from fontWeight, so map the
// requested weight to the matching loaded Roboto family. Regular falls back to the theme token.
const boldWeights = new Set(['bold', '600', '700', '800', '900'])

const resolveFontFamily = (weight: TextStyle['fontWeight'], regular: string): string => {
  const normalized = weight === undefined || weight === null ? '' : String(weight)
  if (boldWeights.has(normalized)) {
    return 'Roboto_700Bold'
  }
  if (normalized === '500') {
    return 'Roboto_500Medium'
  }

  return regular
}

export const Text = forwardRef<RNTextRef, TextProps>(({ style, ...props }, ref) => {
  const theme = useTheme()
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined
  const fontFamily = resolveFontFamily(flattened?.fontWeight, theme.typography.fontFamily)

  return <RNText ref={ref} style={[{ color: theme.colors.textPrimary, fontFamily }, style]} {...props} />
})

Text.displayName = 'Text'

export default Text
