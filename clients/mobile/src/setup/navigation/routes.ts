import Register from '../../authentication/register/UI/Register'
import OTP from '../../authentication/otp/UI/OTP'
import Login from '../../authentication/login/UI/Login'
import Profile from '../../userWorkflow/Profile'

export const routes = [
  {
    name: 'Register',
    component: Register,
    options: { headerShown: false },
    protected: false
  },
  {
    name: 'OTP',
    component: OTP,
    options: { headerShown: true },
    protected: false
  },
  {
    name: 'Login',
    component: Login,
    options: { headerShown: false },
    protected: false
  },
  {
    name: 'Profile',
    component: Profile,
    options: { headerShown: false },
    protected: false
  }
]
