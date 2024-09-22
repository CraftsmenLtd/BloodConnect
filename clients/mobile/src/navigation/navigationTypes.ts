import { StackNavigationProp } from '@react-navigation/stack'
import { RouteProp } from '@react-navigation/native'

export type RootStackParamList = {
  Register: undefined;
  OTP: { email: string };
}

export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>

export type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTP'>
export type OtpScreenRouteProp = RouteProp<RootStackParamList, 'OTP'>
