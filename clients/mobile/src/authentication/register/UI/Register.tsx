import { Text, StyleSheet } from 'react-native'
import { Input } from '../../../components/inputElement/Input'
import { Button } from '../../../components/button/Button'
import { SocialButton } from '../../../components/button/SocialButton'
import { Divider } from '../../../components/button/Divider'
import LinkWithText from '../../../components/button/LinkWithText'
import { useRegister } from '../hooks/useRegister'
import { RegisterScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import AuthLayout from '../../AuthLayout'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { errors, registerCredential, handleInputChange, handleRegister, isButtonDisabled, handleGoogleSignIn, handleFacebookSignIn, socialLoginError, googleLoading, facebookLoading } = useRegister()
  const styles = createStyles(useTheme())

  return (
    <AuthLayout>
      <Input
        name="name"
        label="Name"
        value={registerCredential.name}
        onChangeText={handleInputChange}
        placeholder="Enter your name"
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

      <Button text="Continue" onPress={handleRegister} disabled={isButtonDisabled} />

      <Divider text="Or" />

      {socialLoginError !== '' && <Text style={styles.error}>{socialLoginError}</Text>}

      <SocialButton
        text="Continue with Google"
        onPress={handleGoogleSignIn}
        loading={googleLoading}
        icon={require('../../../../assets/google-icon.png')}
      />

      <SocialButton
        text="Continue with Facebook"
        onPress={handleFacebookSignIn}
        loading={facebookLoading}
        icon={require('../../../../assets/facebook-icon.png')}
      />

      <LinkWithText
        staticText="Already have an account? "
        linkText=" Login"
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
