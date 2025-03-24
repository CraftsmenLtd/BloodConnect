import React from 'react'
import type { StyleProp, ViewStyle, TextStyle} from 'react-native';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import Loader from '../loaders/loader'

interface ButtonProps {
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
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle,
        isDisabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <View style={styles.buttonContent}>
        {loading && <View style={styles.loaderOverlay}><Loader size='small' /></View>}
        <Text style={[styles.buttonText, textStyle, isDisabled && styles.disabledText]}>{text}</Text>
      </View>
    </TouchableOpacity>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 15,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10
    },
    buttonContent: {
      position: 'relative'
    },
    loaderOverlay: {
      position: 'absolute',
      left: 50
    },
    buttonText: {
      color: theme.colors.white,
      fontWeight: 'bold',
      fontSize: theme.typography.fontSize
    },
    disabledButton: {
      backgroundColor: theme.colors.primary,
      opacity: 0.5
    },
    disabledText: {
      color: theme.colors.white
    }
  })

export default Button
