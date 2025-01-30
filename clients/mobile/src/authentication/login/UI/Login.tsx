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
import { SOCIAL_TYPES } from '../../socialAuth/constants/socialTypes'
import { SOCIAL_BUTTON_UI } from '../../socialAuth/constants/socialButtonUI'
import { useTranslation } from 'react-i18next'

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { t } = useTranslation()
  const styles = createStyles(useTheme())
  const { loginLoading, socialLoading, loginCredential, handleInputChange, isPasswordVisible, setIsPasswordVisible, handleLogin, loginError, handleGoogleSignIn, handleFacebookSignIn, socialLoginError } = useLogin()

  return (
    <AuthLayout>
      <Input
        name="email"
        label={t('common.email')}
        value={loginCredential.email}
        onChangeText={handleInputChange}
        placeholder="example@gmail.com"
        keyboardType="default"
      />

      <PasswordInput
        name="password"
        label={t('common.password')}
        value={loginCredential.password}
        onChangeText={handleInputChange}
        isVisible={isPasswordVisible}
        setIsVisible={setIsPasswordVisible}
      />
      {loginError !== '' && <Text style={styles.error}>{loginError}</Text>}

      <LinkWithText
        staticText=""
        linkText={t('common.forgotPassword')}
        onPress={() => { navigation.navigate(SCREENS.FORGOT_PASSWORD) }}
      />

      <Button
        text={t('common.logIn')}
        onPress={handleLogin}
        loading={loginLoading}
      />

      <Divider text={t('common.orText')} />

      {socialLoginError !== '' && <Text style={styles.error}>{socialLoginError}</Text>}

      <SocialButton
        text={t('common.continueWithGoogle')}
        onPress={handleGoogleSignIn}
        loading={socialLoading === SOCIAL_TYPES.GOOGLE}
        icon={SOCIAL_BUTTON_UI.GOOGLE.icon}
      />

      <SocialButton
        text={t('common.continueWithFacebook')}
        onPress={handleFacebookSignIn}
        loading={socialLoading === SOCIAL_TYPES.FACEBOOK}
        icon={SOCIAL_BUTTON_UI.FACEBOOK.icon}
      />

      <LinkWithText
        staticText={t('common.noAccount')}
        linkText={t('common.createAccount')}
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
