import { Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Input } from '../../../components/inputElement/Input'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'
import { PasswordInput } from '../../../components/inputElement/PasswordInput'
import { Button } from '../../../components/button/Button'
import { useLogin } from '../hooks/useLogin'
import { platform } from '../../../setup/constant/platform'
import LinkWithText from '../../../components/button/LinkWithText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const styles = createStyles(useTheme())
  const { loginCredential, handleInputChange, isPasswordVisible, setIsPasswordVisible, handleLogin, loginError } = useLogin()

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === platform.IOS ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Login</Text>

          <Input
            name="email"
            label="Email"
            value={loginCredential.email}
            onChangeText={handleInputChange}
            placeholder="example@gmail.com"
            keyboardType="default"
          />

          <PasswordInput
            name="password"
            label="Password"
            value={loginCredential.password}
            onChangeText={handleInputChange}
            isVisible={isPasswordVisible}
            setIsVisible={setIsPasswordVisible}
          />
          {loginError !== '' && <Text style={styles.error}>{loginError}</Text>}

          <LinkWithText
            staticText=""
            linkText="Forgot Password?"
            onPress={() => { console.log('Forgot Password flow') }}
          />

          <Button text="Login" onPress={handleLogin} />

          <LinkWithText
            staticText="Don't have an account? "
            linkText=" Register"
            onPress={() => { navigation.navigate(SCREENS.REGISTER) }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  error: {
    color: theme.colors.primary,
    fontSize: theme.typography.errorFontSize,
    textAlign: 'center'
  }
})
