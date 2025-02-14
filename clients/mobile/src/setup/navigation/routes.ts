import Register from '../../authentication/register/UI/Register'
import OTP from '../../authentication/otp/UI/OTP'
import Login from '../../authentication/login/UI/Login'
import AboutPage from '../../userWorkflow/about/About'
import { SCREENS } from '../constant/screens'
import Welcome from '../../welcome/WelcomeScreen'
import SetPassword from '../../authentication/setPassword/UI/SetPassword'
import CreateBloodRequest from '../../donationWorkflow/createUpdateDonation/Donation'
import BottomNavigation from './BottomNavigation'
import ForgotPassword from '../../authentication/forgotPassword/UI/ForgotPassword'
import AddPersonalInfo from '../../userWorkflow/personalInfo/UI/AddPersonalInfo'
import ResponseDonationRequest from '../../donationWorkflow/donationPosts/donorResponse/UI/ResponseDonationRequest'
import Detail from '../../myActivity/myPosts/details/Detail'
import DonorProfile from '../../myActivity/donorProfile/DonorProfile'
import DonorResponse from '../../donationWorkflow/donorResponse/DonorResponse'
import { Account } from '../../userWorkflow/account/UI/Account'
import Profile from '../../userWorkflow/userProfile/UI/Profile'
import EditProfile from '../../userWorkflow/editUserProfile/UI/EditProfile'
import RequestStatusScreen from '../../myActivity/donorTracking/bloodRequestStatus/RequestStatusScreen'
import DonorConfirmationScreen from '../../myActivity/donorTracking/donorConfirmation/DonorConfirmationScreen'

export const routes = [
  {
    name: SCREENS.WELCOME,
    component: Welcome,
    options: { headerShown: false },
    protected: false
  },
  {
    name: SCREENS.REGISTER,
    component: Register,
    options: { headerShown: true, headerTitle: 'Create New Account' },
    protected: false
  },
  {
    name: SCREENS.OTP,
    component: OTP,
    options: { headerShown: true },
    protected: false
  },
  {
    name: SCREENS.SET_PASSWORD,
    component: SetPassword,
    options: { headerShown: true, headerTitle: 'Set New Password' },
    protected: false
  },
  {
    name: SCREENS.LOGIN,
    component: Login,
    options: { headerShown: true, headerTitle: 'Log In' },
    protected: false
  },
  {
    name: SCREENS.FORGOT_PASSWORD,
    component: ForgotPassword,
    options: { headerShown: true, headerTitle: 'Forgot Password' },
    protected: false
  },
  {
    name: SCREENS.DONATION,
    component: CreateBloodRequest,
    options: { headerShown: true, headerTitle: 'Create Blood Request' },
    protected: true
  },
  {
    name: SCREENS.BOTTOM_TABS,
    component: BottomNavigation,
    options: { headerShown: false },
    protected: true
  },
  {
    name: SCREENS.ACCOUNT,
    component: Account,
    options: { headerShown: true, headerTitle: 'Account' },
    protected: true
  },
  {
    name: SCREENS.ADD_PERSONAL_INFO,
    component: AddPersonalInfo,
    options: { headerShown: true, headerTitle: 'Add Personal Info' },
    protected: true
  },
  {
    name: SCREENS.BLOOD_REQUEST_PREVIEW,
    component: ResponseDonationRequest,
    options: { headerShown: true, headerTitle: 'Blood Request' },
    protected: true
  },
  {
    name: SCREENS.DETAIL_POST,
    component: Detail,
    options: { headerShown: true, headerTitle: 'My Post' },
    protected: true
  },
  {
    name: SCREENS.DONOR_PROFILE,
    component: DonorProfile,
    options: { headerShown: true, headerTitle: 'Profile' },
    protected: true
  },
  {
    name: SCREENS.DONOR_RESPONSE,
    component: DonorResponse,
    options: { headerShown: true },
    protected: true
  },
  {
    name: SCREENS.PROFILE,
    component: Profile,
    options: { headerShown: true, headerTitle: 'Profile' },
    protected: true
  },
  {
    name: SCREENS.EDIT_PROFILE,
    component: EditProfile,
    options: { headerShown: true, headerTitle: 'Edited Profile' },
    protected: true
  },
  {
    name: SCREENS.REQUEST_STATUS,
    component: RequestStatusScreen,
    options: { headerShown: true, headerTitle: '' },
    protected: true
  },
  {
    name: SCREENS.DONOR_CONFIRMATION,
    component: DonorConfirmationScreen,
    options: { headerShown: true, headerTitle: '' },
    protected: true
  },
  {
    name: SCREENS.ABOUT,
    component: AboutPage,
    options: { headerShown: true, headerTitle: 'About' },
    protected: true
  }
]
