import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native'
import { Input } from '../../../components/inputElement/Input'
import { useTheme } from '../../../hooks/useTheme'
import { Theme } from '../../../theme'
import { PasswordInput } from '../../../components/inputElement/PasswordInput'
import { Button } from '../../../components/button/Button'
import { useRegister } from '../hooks/useRegister'
import { platform } from '../../../constant/platform'

export default function RegisterScreen() {
  const styles = createStyles(useTheme())
  const { errors, registerCredential, handleInputChange, isPasswordVisible, setIsPasswordVisible, handleRegister } = useRegister()

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === platform.IOS ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Register</Text>

        <Input
          name="name"
          label="Name"
          value={registerCredential.name}
          onChangeText={handleInputChange}
          placeholder="Jon Doe"
          keyboardType="twitter"
          error={errors.name}
        />

        <Input
          name="email"
          label="Email"
          value={registerCredential.email}
          onChangeText={handleInputChange}
          placeholder="example@gmail.com"
          keyboardType="default"
          error={errors.email}
        />

        <Input
          name="phoneNumber"
          label="Phone Number"
          value={registerCredential.phoneNumber}
          onChangeText={handleInputChange}
          placeholder="01XXXXXXXXX"
          keyboardType="phone-pad"
          error={errors.phoneNumber}
        />

        <PasswordInput
          name="password"
          label="Password"
          value={registerCredential.password}
          onChangeText={handleInputChange}
          isVisible={isPasswordVisible}
          setIsVisible={setIsPasswordVisible}
          error={errors.password}
        />

        <Button text="Register" onPress={handleRegister} />

        <View style={styles.registerContainer}>
          <Text>Already have an account? </Text>
          <TouchableOpacity onPress={() => { console.log('LOGIN PAGE NOT IMPLEMENTED YET.') }}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.white
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  loginLink: {
    color: theme.colors.primary
  }
})
