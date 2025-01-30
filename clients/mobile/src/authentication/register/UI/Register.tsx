import { StyleSheet, Text } from 'react-native'
import { Input } from '../../../components/inputElement/Input'
import { Button } from '../../../components/button/Button'
import { SocialButton } from '../../../components/button/SocialButton'
import { Divider } from '../../../components/button/Divider'
import LinkWithText from '../../../components/button/LinkWithText'
import Warning from '../../../components/warning'
import { WARNINGS } from '../../../setup/constant/consts'
import { useRegister } from '../hooks/useRegister'
import { RegisterScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import AuthLayout from '../../AuthLayout'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'
import { SOCIAL_TYPES } from '../../socialAuth/constants/socialTypes'
import { SOCIAL_BUTTON_UI } from '../../socialAuth/constants/socialButtonUI'
import { useTranslation } from 'react-i18next'

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { t } = useTranslation()
  const { errors, socialLoading, registerCredential, handleInputChange, handleRegister, isButtonDisabled, handleGoogleSignIn, handleFacebookSignIn, socialLoginError } = useRegister()
  const styles = createStyles(useTheme())

  return (
    <AuthLayout>
      <Input
        name="name"
        label={t('common.name')}
        value={registerCredential.name}
        onChangeText={handleInputChange}
        placeholder={t('common.namePlaceholder')}
        keyboardType="twitter"
        error={errors.name}
      />

      <Input
        name="email"
        label={t('common.email')}
        value={registerCredential.email}
        onChangeText={handleInputChange}
        placeholder="example@gmail.com"
        keyboardType="default"
        error={errors.email}
      />

      <Input
        name="phoneNumber"
        label={t('common.phoneNumber')}
        value={registerCredential.phoneNumber}
        onChangeText={handleInputChange}
        placeholder="01XXXXXXXXX"
        keyboardType="phone-pad"
        error={errors.phoneNumber}
      />
      <Warning
        text={WARNINGS.PHONE_NUMBER_VISIBLE}
        showWarning={registerCredential.phoneNumber !== ''}
      />

      <Button text={t('common.continue')} onPress={handleRegister} disabled={isButtonDisabled} />

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
        staticText={t('common.alreadyHaveAccount')}
        linkText={t('common.logIn')}
        onPress={() => { navigation.navigate(SCREENS.LOGIN) }}
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
