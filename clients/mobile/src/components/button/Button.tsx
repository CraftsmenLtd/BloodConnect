import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import { Theme } from '../../theme'

interface ButtonProps {
  text: string;
  onPress: () => void;
}

export const Button = ({ text, onPress }: ButtonProps) => {
  const styles = createStyles(useTheme())
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
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
    fontWeight: 'bold'
  }
})
