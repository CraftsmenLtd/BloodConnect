import { StackNavigationProp } from '@react-navigation/stack'
import { RouteProp } from '@react-navigation/native'

export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  OTP: { email: string };
  Profile: undefined;
}

export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>

export type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTP'>
export type OtpScreenRouteProp = RouteProp<RootStackParamList, 'OTP'>
