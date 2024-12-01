import { useState } from 'react'
import { useNavigation, CommonActions, NavigationProp } from '@react-navigation/native'
import { SCREENS } from '../../../setup/constant/screens'
import { googleLogin, facebookLogin } from '../../services/authService'
import { useAuth } from '../../context/useAuth'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { useUserProfile } from '../../../userWorkflow/context/UserProfileContext'
import registerUserDeviceForNotification from '../../../utility/deviceRegistration'
import { SocialLoadingState } from '../types/loadingType'
import { RootStackParamList } from '../../../setup/navigation/navigationTypes'

interface UseSocialAuthOutput {
  socialLoadingState: SocialLoadingState;
  socialLoginError: string;
  handleGoogleSignIn: () => Promise<void>;
  handleFacebookSignIn: () => Promise<void>;
}

export const useSocialAuth = (): UseSocialAuthOutput => {
  const fetchClient = useFetchClient()
  const { userProfile } = useUserProfile()
  const { setIsAuthenticated } = useAuth()
  const [socialLoadingState, setSocialLoadingState] = useState<SocialLoadingState>('idle')
  const [socialLoginError, setSocialLoginError] = useState<string>('')
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()

  const handleSocialSignIn = async(loginFunction: () => Promise<void>, socialMedia: string): Promise<void> => {
    try {
      setSocialLoadingState(socialMedia.toLowerCase() as SocialLoadingState)
      await loginFunction()
      setIsAuthenticated(true)
      registerUserDeviceForNotification(fetchClient)
      const hasProfile = Boolean(userProfile?.bloodGroup)
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: hasProfile ? SCREENS.BOTTOM_TABS : SCREENS.ADD_PERSONAL_INFO }]
          })
        )
      }, 900)
    } catch (error) {
      setSocialLoginError(`${socialMedia} login failed. Please try again.`)
    } finally {
      setSocialLoadingState('idle')
    }
  }

  const handleGoogleSignIn = async(): Promise<void> => {
    await handleSocialSignIn(googleLogin, 'Google')
  }

  const handleFacebookSignIn = async(): Promise<void> => {
    await handleSocialSignIn(facebookLogin, 'Facebook')
  }

  return {
    socialLoadingState,
    socialLoginError,
    handleGoogleSignIn,
    handleFacebookSignIn
  }
}
