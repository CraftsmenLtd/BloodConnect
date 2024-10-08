import { Input } from '../../../components/inputElement/Input'
import { Button } from '../../../components/button/Button'
import { useRegister } from '../hooks/useRegister'
import LinkWithText from '../../../components/button/LinkWithText'
import { RegisterScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import AuthLayout from '../../AuthLayout'

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { errors, registerCredential, handleInputChange, handleRegister, isButtonDisabled } = useRegister()

  return (
    <AuthLayout>
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

      <Button text="Continue" onPress={handleRegister} disabled={isButtonDisabled} />

      <LinkWithText
        staticText="Already have an account? "
        linkText=" Login"
        onPress={() => { navigation.navigate(SCREENS.LOGIN) }}
      />
    </AuthLayout>
  )
}
