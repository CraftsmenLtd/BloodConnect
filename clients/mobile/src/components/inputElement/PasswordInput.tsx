import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import type { InputProps } from './types'
import { commonStyles } from './commonStyles'
import type { Dispatch, SetStateAction } from 'react'

interface PasswordInputProps extends Omit<InputProps, 'placeholder'> {
  isVisible: boolean;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
}

export const PasswordInput = ({ name, label, value, onChangeText, isVisible, setIsVisible, error }: PasswordInputProps) => {
  const styles = createStyles(useTheme())

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="**********"
          secureTextEntry={!isVisible}
          value={value}
          onChangeText={(text) => { onChangeText(name, text) }}
        />
        <TouchableOpacity onPress={() => { setIsVisible((prevState) => { return !prevState }) }} style={styles.eyeIcon}>
          <FontAwesome name={isVisible ? 'eye' : 'eye-slash'} size={20} color="gray" />
        </TouchableOpacity>
      </View>
      {error !== null && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 5,
    paddingHorizontal: 10
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10
  },
  eyeIcon: {
    padding: 10
  }
})
