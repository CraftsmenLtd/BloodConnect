import 'react-native-gesture-handler'
import { LogBox, StatusBar } from 'react-native'
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
import Constants from 'expo-constants'
import { MyActivityProvider } from './src/myActivity/context/MyActivityProvider'
import useBackPressHandler from './src/hooks/useBackPressHandler'

const { APP_ENV } = Constants.expoConfig?.extra ?? {}

if (APP_ENV !== 'development') {
  LogBox.ignoreAllLogs(true)
}

Amplify.configure(awsCognitoConfiguration)

Notifications.setNotificationHandler({
  handleNotification: async() => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
})

export default function App() {
  useBackPressHandler()
  const navigationRef = useNavigationContainerRef<RootStackParamList>()

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <NotificationProvider navigationRef={navigationRef}>
          <AuthProvider>
            <UserProfileProvider>
              <MyActivityProvider>
                <ThemeProvider>
                  {/* TODO: need to use themes' primary color but it's not working. */}
                  <StatusBar hidden={false} backgroundColor='#FF4D4D' />
                  <Navigator />
                </ThemeProvider>
              </MyActivityProvider>
            </UserProfileProvider>
          </AuthProvider>
        </NotificationProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
