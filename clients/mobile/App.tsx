import 'react-native-gesture-handler'
import React, { useEffect, useState } from 'react'
import { BackHandler, ToastAndroid, LogBox } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from './src/setup/theme/context/ThemeContext'
import Navigator from './src/setup/navigation/Navigator'
import { Amplify } from 'aws-amplify'
import { awsCognitoConfiguration } from './src/setup/config/cognito'
import { AuthProvider } from './src/authentication/context/AuthContext'
import { NotificationProvider } from './src/setup/notification/NotificationProvider'
import * as Notifications from 'expo-notifications'

// LogBox.ignoreAllLogs(true)

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
      <NavigationContainer>
        <AuthProvider>
          <NotificationProvider>
            <ThemeProvider>
              <Navigator />
            </ThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
