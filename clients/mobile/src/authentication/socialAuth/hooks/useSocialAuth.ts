import { useState } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { SCREENS } from '../../../setup/constant/screens'
import { googleLogin, facebookLogin } from '../../services/authService'
import { useAuth } from '../../context/useAuth'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { useUserProfile } from '../../../userWorkflow/context/UserProfileContext'
import registerUserDeviceForNotification from '../../../utility/deviceRegistration'
import type { SocialLoading } from '../types/loadingType'
import type { LoginScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SOCIAL_TYPES } from '../constants/socialTypes'

type UseSocialAuthOutput = {
  socialLoading: SocialLoading;
  socialLoginError: string;
  handleGoogleSignIn: () => Promise<void>;
  handleFacebookSignIn: () => Promise<void>;
}

export const useSocialAuth = (): UseSocialAuthOutput => {
  const fetchClient = useFetchClient()
  const { userProfile } = useUserProfile()
  const { setIsAuthenticated } = useAuth()
  const [socialLoading, setSocialLoading] = useState<SocialLoading>('idle')
  const [socialLoginError, setSocialLoginError] = useState<string>('')
  const navigation = useNavigation<LoginScreenNavigationProp>()

  const handleSocialSignIn = async(loginFunction: () => Promise<void>, socialMedia: string): Promise<void> => {
    try {
      setSocialLoading(socialMedia.toLowerCase() as SocialLoading)
      await loginFunction()
      setIsAuthenticated(true)
      registerUserDeviceForNotification(fetchClient)
      const hasProfile = Boolean(userProfile?.bloodGroup)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: hasProfile ? SCREENS.BOTTOM_TABS : SCREENS.ADD_PERSONAL_INFO }]
        })
      )
    } catch (error) {
      setSocialLoginError(`${socialMedia} login failed. Please try again.`)
    } finally {
      setSocialLoading('idle')
    }
  }

  const handleGoogleSignIn = async(): Promise<void> => {
    await handleSocialSignIn(googleLogin, SOCIAL_TYPES.GOOGLE)
  }

  const handleFacebookSignIn = async(): Promise<void> => {
    await handleSocialSignIn(facebookLogin, SOCIAL_TYPES.FACEBOOK)
  }

  return {
    socialLoading,
    socialLoginError,
    handleGoogleSignIn,
    handleFacebookSignIn
  }
}
