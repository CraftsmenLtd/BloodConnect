import 'react-native-gesture-handler'
import React, { useState, useEffect } from 'react'
import { BackHandler, ToastAndroid } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { ThemeProvider } from './src/setup/theme/context/ThemeContext'
import Navigator from './src/setup/navigation/Navigator'
import { Amplify } from 'aws-amplify'
import { awsCognitoConfiguration } from './src/setup/config/cognito'
import { AuthProvider } from './src/authentication/context/AuthContext'
import { NotificationProvider } from './src/setup/notification/NotificationProvider'
import { UserProfileProvider } from './src/userWorkflow/context/UserProfileContext'
import * as Notifications from 'expo-notifications'
import { RootStackParamList } from './src/setup/navigation/navigationTypes'

Amplify.configure(awsCognitoConfiguration)

Notifications.setNotificationHandler({
  handleNotification: async() => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
})

export default function App() {
  const [backPressedOnce, setBackPressedOnce] = useState(false)
  const navigationRef = useNavigationContainerRef<RootStackParamList>()

  useEffect(() => {
    const backAction = () => {
      if (backPressedOnce) {
        BackHandler.exitApp()
      } else {
        setBackPressedOnce(true)
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT)
        setTimeout(() => { setBackPressedOnce(false) }, 2000)
      }
      return true
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => { backHandler.remove() }
  }, [backPressedOnce])

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <NotificationProvider navigationRef={navigationRef}>
          <AuthProvider>
          <UserProfileProvider>
            <ThemeProvider>
              <Navigator />
            </ThemeProvider>
            </UserProfileProvider>
          </AuthProvider>
        </NotificationProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
