import { Text, StyleSheet } from 'react-native'
import { Input } from '../../../components/inputElement/Input'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import type { Theme } from '../../../setup/theme'
import { PasswordInput } from '../../../components/inputElement/PasswordInput'
import { Button } from '../../../components/button/Button'
import { useLogin } from '../hooks/useLogin'
import LinkWithText from '../../../components/button/LinkWithText'
import type { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import AuthLayout from '../../AuthLayout'
import { SocialButton } from '../../../components/button/SocialButton'
import { Divider } from '../../../components/button/Divider'
import { SOCIAL_TYPES } from '../../socialAuth/constants/socialTypes'
import { SOCIAL_BUTTON_UI } from '../../socialAuth/constants/socialButtonUI'

type LoginScreenProps = {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const styles = createStyles(useTheme())
  const {
    loginLoading,
    socialLoading,
    loginCredential,
    handleInputChange,
    isPasswordVisible,
    setIsPasswordVisible,
    handleLogin,
    loginError,
    handleGoogleSignIn,
    handleFacebookSignIn,
    socialLoginError
  } = useLogin()

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
        onPress={() => { navigation.navigate(SCREENS.FORGOT_PASSWORD) }}
      />

      <Button
        text="Login"
        onPress={handleLogin}
        loading={loginLoading}
      />

      <Divider text="Or" />

      {socialLoginError !== '' && <Text style={styles.error}>{socialLoginError}</Text>}

      <SocialButton
        text={SOCIAL_BUTTON_UI.GOOGLE.text}
        onPress={handleGoogleSignIn}
        loading={socialLoading === SOCIAL_TYPES.GOOGLE}
        icon={SOCIAL_BUTTON_UI.GOOGLE.icon}
      />

      <SocialButton
        text={SOCIAL_BUTTON_UI.FACEBOOK.text}
        onPress={handleFacebookSignIn}
        loading={socialLoading === SOCIAL_TYPES.FACEBOOK}
        icon={SOCIAL_BUTTON_UI.FACEBOOK.icon}
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
