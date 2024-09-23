import Register from '../../authentication/register/UI/Register'
import OTP from '../../authentication/otp/UI/OTP'

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
  }
]
