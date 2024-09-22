import React from 'react'
import { View, TextInput, Text, StyleSheet, KeyboardTypeOptions } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import { Theme } from '../../theme'
import { commonStyles } from './commonStyles'
import { InputProps } from './types'

interface InputElementProps extends InputProps {
  keyboardType: KeyboardTypeOptions;
}

export const Input = ({ name, label, value, onChangeText, placeholder, error, keyboardType = 'default' }: InputElementProps) => {
  const styles = createStyles(useTheme())

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={(text) => { onChangeText(name, text) }}
        keyboardType={keyboardType}
      />
      {error !== '' && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  input: {
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 5,
    padding: 10,
    width: '100%'
  }
})
