import { StackNavigationProp } from '@react-navigation/stack'
import { RouteProp } from '@react-navigation/native'
import { SCREENS } from '../constant/screens'
import { UserRegistrationCredentials } from '../../authentication/services/authService'
import { DonationScreenParams } from '../../donationWorkflow/types'

export type RootStackParamList = {
  [SCREENS.WELCOME]: undefined;
  [SCREENS.REGISTER]: undefined;
  [SCREENS.LOGIN]: undefined;
  [SCREENS.OTP]: { email: string; password: string };
  [SCREENS.SET_PASSWORD]: { params: UserRegistrationCredentials; fromScreen: SCREENS };
  [SCREENS.PROFILE]: undefined;
  [SCREENS.DONATION]: { data: DonationScreenParams | null; isUpdating: boolean };
  [SCREENS.BOTTOM_TABS]: undefined;
  [SCREENS.DONATION_POSTS]: { data: DonationScreenParams | null; isUpdating: boolean };
}

export type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.WELCOME>
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.REGISTER>
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.LOGIN>
export type SetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.SET_PASSWORD>
export type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.PROFILE>
export type DonationScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONATION>
export type DonationPostsScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONATION_POSTS>
export type BottomTabsNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.BOTTOM_TABS>

export type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.OTP>
export type OtpScreenRouteProp = RouteProp<RootStackParamList, SCREENS.OTP>
export type SetPasswordRouteProp = RouteProp<RootStackParamList, SCREENS.SET_PASSWORD>
export type DonationScreenRouteProp = RouteProp<RootStackParamList, SCREENS.DONATION>
