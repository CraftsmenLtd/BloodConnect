import type { StackNavigationProp } from '@react-navigation/stack'
import type { RouteProp } from '@react-navigation/native'
import type { SCREENS } from '../constant/screens'
import type { UserRegistrationCredentials } from '../../authentication/services/authService'
import type { DonationScreenParams } from '../../donationWorkflow/types'
import type { DonationData } from '../../donationWorkflow/donationPosts/useDonationPosts'
import type { DonorResponseNotification } from '../../donationWorkflow/donorResponse/type'
import type { NotificationData } from '../notification/NotificationData'
import type { EditProfileData } from '../../userWorkflow/userProfile/UI/Profile'
import type { DonorItem } from '../../myActivity/myPosts/donorResponses/DonorResponses'

type FromScreen = SCREENS.SET_PASSWORD | SCREENS.FORGOT_PASSWORD

export type RootStackParamList = {
  [SCREENS.WELCOME]: undefined;
  [SCREENS.REGISTER]: undefined;
  [SCREENS.LOGIN]: undefined;
  [SCREENS.OTP]: { email: string; password: string; fromScreen: FromScreen };
  [SCREENS.SET_PASSWORD]: { routeParams: UserRegistrationCredentials | { email: string; otp: string }; fromScreen: SCREENS };
  [SCREENS.FORGOT_PASSWORD]: undefined;
  [SCREENS.PROFILE]: undefined;
  [SCREENS.EDIT_PROFILE]: { userDetails: EditProfileData };
  [SCREENS.DONATION]: { data: Omit<DonationScreenParams, 'acceptedDonors'> | null; isUpdating: boolean };
  [SCREENS.BOTTOM_TABS]: undefined;
  [SCREENS.DONATION_POSTS]: { data: DonationScreenParams | null; isUpdating: boolean };
  [SCREENS.ADD_PERSONAL_INFO]: undefined;
  [SCREENS.POSTS]: undefined;
  [SCREENS.DETAIL_POST]: { data: DonationData; tab?: string; useAsDetailsPage?: boolean };
  [SCREENS.DONOR_PROFILE]: { donorId: string };
  [SCREENS.DONOR_RESPONSE]: { notificationData: DonorResponseNotification };
  [SCREENS.MY_ACTIVITY]: undefined;
  [SCREENS.BLOOD_REQUEST_PREVIEW]: { notificationData: NotificationData };
  [SCREENS.ACCOUNT]: undefined;
  [SCREENS.REQUEST_STATUS]: { requestPostId: string; createdAt: string };
  [SCREENS.DONOR_CONFIRMATION]: { requestPostId: string; donors: DonorItem[]; createdAt: string };
  [SCREENS.ABOUT]: undefined;
  [SCREENS.NO_INTERNET]: undefined;
}

export type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.WELCOME>
export type PostScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.POSTS>
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.REGISTER>
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.LOGIN>
export type SetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.SET_PASSWORD>
export type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.FORGOT_PASSWORD>
export type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.PROFILE>
export type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.EDIT_PROFILE>
export type DonationScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONATION>
export type DonationPostsScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONATION_POSTS>
export type BottomTabsNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.BOTTOM_TABS>
export type RequestPreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.BLOOD_REQUEST_PREVIEW>
export type DetailPostScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DETAIL_POST>
export type DonorProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONOR_PROFILE>
export type MyActivityScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.MY_ACTIVITY>
export type DonorResponseScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONOR_RESPONSE>
export type AccountScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.ACCOUNT>
export type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.OTP>
export type AddPersonalInfoNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.ADD_PERSONAL_INFO>
export type RequestStatusNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.REQUEST_STATUS>
export type DonorConfirmationNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.DONOR_CONFIRMATION>
export type NoInternetNavigationProp = StackNavigationProp<RootStackParamList, SCREENS.NO_INTERNET>

export type OtpScreenRouteProp = RouteProp<RootStackParamList, SCREENS.OTP>
export type SetPasswordRouteProp = RouteProp<RootStackParamList, SCREENS.SET_PASSWORD>
export type DonationScreenRouteProp = RouteProp<RootStackParamList, SCREENS.DONATION>
export type RequestPreviewRouteProp = RouteProp<RootStackParamList, SCREENS.BLOOD_REQUEST_PREVIEW>
export type DetailPostRouteProp = RouteProp<RootStackParamList, SCREENS.DETAIL_POST>
export type ProfileRouteProp = RouteProp<RootStackParamList, SCREENS.PROFILE>
export type EditProfileRouteProp = RouteProp<RootStackParamList, SCREENS.EDIT_PROFILE>
export type DonorResponseRouteProp = RouteProp<RootStackParamList, SCREENS.DONOR_RESPONSE>
export type DonorProfileRouteProp = RouteProp<RootStackParamList, SCREENS.DONOR_PROFILE>
export type RequestStatusRouteProp = RouteProp<RootStackParamList, SCREENS.REQUEST_STATUS>
export type DonorConfirmationRouteProp = RouteProp<RootStackParamList, SCREENS.DONOR_CONFIRMATION>
export type About = RouteProp<RootStackParamList, SCREENS.ABOUT>
export type NoInternetRouteProp = RouteProp<RootStackParamList, SCREENS.NO_INTERNET>
