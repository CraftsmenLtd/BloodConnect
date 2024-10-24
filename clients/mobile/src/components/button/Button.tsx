import React from 'react'
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'

interface ButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button = ({ text, onPress, buttonStyle, textStyle, disabled = false }: ButtonProps) => {
  const styles = createStyles(useTheme())
  return (
    <TouchableOpacity style={[styles.button, buttonStyle, disabled && styles.disabledButton]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.buttonText, textStyle, disabled && styles.disabledText]}>{text}</Text>
    </TouchableOpacity>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: 10
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize
  },
  disabledButton: {
    backgroundColor: theme.colors.grey,
    opacity: 0.6
  },
  disabledText: {
    color: theme.colors.lightGrey
  }
})
