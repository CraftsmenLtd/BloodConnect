import Register from '../../authentication/register/UI/Register'
import OTP from '../../authentication/otp/UI/OTP'
import Login from '../../authentication/login/UI/Login'
import Profile from '../../userWorkflow/Profile'
import { SCREENS } from '../constant/screens'

export const routes = [
  {
    name: SCREENS.REGISTER,
    component: Register,
    options: { headerShown: false },
    protected: false
  },
  {
    name: SCREENS.OTP,
    component: OTP,
    options: { headerShown: true },
    protected: false
  },
  {
    name: SCREENS.LOGIN,
    component: Login,
    options: { headerShown: false },
    protected: false
  },
  {
    name: SCREENS.PROFILE,
    component: Profile,
    options: { headerShown: false },
    protected: false
  }
]
