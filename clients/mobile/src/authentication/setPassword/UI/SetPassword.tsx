import React, { useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'
import { Button } from '../../../components/button/Button'
import { PASSWORD_INPUT_NAME, useSetPassword } from '../hooks/useSetPassword'
import AuthLayout from '../../AuthLayout'
import { PasswordInput } from '../../../components/inputElement/PasswordInput'

export default function SetPassword(): JSX.Element {
  const styles = createStyles(useTheme())
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  const { newPassword, errors, handleInputChange, handleSetPassword, error, isButtonDisabled } = useSetPassword()

  return (
    <AuthLayout>
      <PasswordInput
        name={PASSWORD_INPUT_NAME}
        label="New Password"
        value={newPassword.password}
        onChangeText={handleInputChange}
        isVisible={isPasswordVisible}
        setIsVisible={setIsPasswordVisible}
        error={errors.password}
      />

      <PasswordInput
        name="confirmPassword"
        label="Confirm Password"
        value={newPassword.confirmPassword}
        onChangeText={handleInputChange}
        isVisible={isConfirmPasswordVisible}
        setIsVisible={setIsConfirmPasswordVisible}
        error={errors.confirmPassword}
      />

      {error !== '' && <Text style={styles.error}>{error}</Text>}
      <Button text="Set Password" onPress={handleSetPassword} disabled={isButtonDisabled} />
    </AuthLayout>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  error: {
    color: theme.colors.primary,
    fontSize: theme.typography.errorFontSize,
    textAlign: 'center'
  }
})
