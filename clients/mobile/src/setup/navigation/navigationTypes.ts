import { StackNavigationProp } from '@react-navigation/stack'
import { RouteProp } from '@react-navigation/native'
import { SCREENS } from '../constant/screens'
import { UserRegistrationCredentials } from '../../authentication/services/authService'
import { DonationScreenParams } from '../../donationWorkflow/types'
import { DonorResponseNotification } from '../../donationWorkflow/donorResponse/type'
import { NotificationData } from '../notification/NotificationData'

type FromScreen = SCREENS.SET_PASSWORD | SCREENS.FORGOT_PASSWORD

export type RootStackParamList = {
  [SCREENS.WELCOME]: undefined;
  [SCREENS.REGISTER]: undefined;
  [SCREENS.LOGIN]: undefined;
  [SCREENS.OTP]: { email: string; password: string; fromScreen: FromScreen };
  [SCREENS.SET_PASSWORD]: { routeParams: UserRegistrationCredentials | { email: string; otp: string }; fromScreen: SCREENS };
  [SCREENS.FORGOT_PASSWORD]: undefined;
  [SCREENS.PROFILE]: undefined;
  [SCREENS.DONATION]: { data: DonationScreenParams | null; isUpdating: boolean };
  [SCREENS.BOTTOM_TABS]: undefined;
  [SCREENS.DONATION_POSTS]: { data: DonationScreenParams | null; isUpdating: boolean };
  [SCREENS.ADD_PERSONAL_INFO]: undefined;
  [SCREENS.POSTS]: undefined;
  [SCREENS.DONAR_RESPONSE]: { notificationData: DonorResponseNotification };
  [SCREENS.BLOOD_REQUEST_PREVIEW]: { notificationData: NotificationData };
  [SCREENS.ACCOUNT]: undefined;
}

export type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.WELCOME>
export type PostScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.POSTS>
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.REGISTER>
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.LOGIN>
export type SetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.SET_PASSWORD>
export type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.FORGOT_PASSWORD>
export type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.PROFILE>
export type DonationScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONATION>
export type DonationPostsScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONATION_POSTS>
export type BottomTabsNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.BOTTOM_TABS>
export type RequestPreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.BLOOD_REQUEST_PREVIEW>
export type DonarResponseScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONAR_RESPONSE>
export type AccountScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.ACCOUNT>

export type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.OTP>
export type AddPersonalInfoNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.ADD_PERSONAL_INFO>

export type OtpScreenRouteProp = RouteProp<RootStackParamList, SCREENS.OTP>
export type SetPasswordRouteProp = RouteProp<RootStackParamList, SCREENS.SET_PASSWORD>
export type DonationScreenRouteProp = RouteProp<RootStackParamList, SCREENS.DONATION>
export type RequestPreviewRouteProp = RouteProp<RootStackParamList, SCREENS.BLOOD_REQUEST_PREVIEW>
export type DonarResponseRouteProp = RouteProp<RootStackParamList, SCREENS.DONAR_RESPONSE>
export type ProfileRouteProp = RouteProp<RootStackParamList, SCREENS.PROFILE>
