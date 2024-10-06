import { Text, StyleSheet } from 'react-native'
import { Input } from '../../../components/inputElement/Input'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'
import { PasswordInput } from '../../../components/inputElement/PasswordInput'
import { Button } from '../../../components/button/Button'
import { useLogin } from '../hooks/useLogin'
import LinkWithText from '../../../components/button/LinkWithText'
import { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import AuthLayout from '../../AuthLayout'
import { SocialButton } from '../../../components/button/SocialButton'
import { Divider } from '../../../components/button/Divider'

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const styles = createStyles(useTheme())
  const { loginCredential, handleInputChange, isPasswordVisible, setIsPasswordVisible, handleLogin, loginError, handleGoogleSignIn, socialLoginError } = useLogin()

  return (
    <AuthLayout>
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

      <Divider text="Or" />

      {socialLoginError !== '' && <Text style={styles.error}>{socialLoginError}</Text>}

      <SocialButton
        text="Continue with Google"
        onPress={handleGoogleSignIn}
        icon={require('../../../../assets/google-icon.png')}
      />

      <LinkWithText
        staticText="Don't have an account? "
        linkText=" Register"
        onPress={() => { navigation.navigate(SCREENS.REGISTER) }}
      />
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
