import React from 'react'
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'

interface DividerProps {
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
    marginTop: 15,
    marginBottom: 25
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.extraLightGray
  },
  text: {
    marginHorizontal: 10,
    fontSize: 14,
    color: theme.colors.textSecondary
  }
})
