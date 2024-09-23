import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { InputProps } from './types'
import { commonStyles } from './commonStyles'

interface PasswordInputProps extends Omit<InputProps, 'placeholder'> {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => boolean;
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
        <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={styles.eyeIcon}>
          <FontAwesome name={isVisible ? 'eye' : 'eye-slash'} size={20} color="gray" />
        </TouchableOpacity>
      </View>
      {error !== '' && <Text style={styles.error}>{error}</Text>}
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
