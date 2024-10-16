import Register from '../../authentication/register/UI/Register'
import OTP from '../../authentication/otp/UI/OTP'
import Login from '../../authentication/login/UI/Login'
import Profile from '../../userWorkflow/Profile'
import { SCREENS } from '../constant/screens'
import Welcome from '../../welcome/WelcomeScreen'
import SetPassword from '../../authentication/setPassword/UI/SetPassword'

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
    options: { headerShown: true, headerTitle: '' },
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
    name: SCREENS.PROFILE,
    component: Profile,
    options: { headerShown: false },
    protected: false
  }
]
