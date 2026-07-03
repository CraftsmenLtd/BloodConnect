import React from 'react'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import { View, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { spacing } from '../../setup/theme/tokens'

type DividerProps = {
  text?: string;
  containerStyle?: StyleProp<ViewStyle>;
  lineStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Divider = ({ text, containerStyle, lineStyle, textStyle }: DividerProps) => {
  const styles = createStyles(useTheme())

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.line, lineStyle]} />
      {text !== undefined && text !== '' && (
        <Text style={[styles.text, textStyle]}>{text}</Text>
      )}
      <View style={[styles.line, lineStyle]} />
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border
  },
  text: {
    marginHorizontal: spacing.md,
    fontSize: 14,
    color: theme.colors.textSecondary
  }
})
