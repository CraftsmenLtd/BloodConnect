import 'react-native-gesture-handler'
import '@react-native-firebase/app'
import { LogBox, StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { NetInfoProvider } from './src/authentication/context/NetInfo'
import { NetInfoModal } from './src/components/NetInfoModal'
import { ThemeProvider } from './src/setup/theme/context/ThemeContext'
import Navigator from './src/setup/navigation/Navigator'
import { Amplify } from 'aws-amplify'
import { awsCognitoConfiguration } from './src/setup/config/cognito'
import { AuthProvider } from './src/authentication/context/AuthContext'
import { NotificationProvider } from './src/setup/notification/NotificationProvider'
import { UserProfileProvider } from './src/userWorkflow/context/UserProfileContext'
import * as Notifications from 'expo-notifications'
import type { RootStackParamList } from './src/setup/navigation/navigationTypes'
import Constants from 'expo-constants'
import { MyActivityProvider } from './src/myActivity/context/MyActivityProvider'
import useBackPressHandler from './src/hooks/useBackPressHandler'
import Monitoring from './src/setup/monitoring/MonitoringService'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from './src/setup/language/i18n'

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

ErrorUtils.setGlobalHandler((error, isFatal) => {
  Monitoring.recordError(error)
  if (isFatal !== null) {
    Monitoring.log('Fatal error occurred')
  }
})

export default function App() {
  useTranslation()
  useBackPressHandler()
  const navigationRef = useNavigationContainerRef<RootStackParamList>()

  return (
    <I18nextProvider i18n={i18n} >
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <NetInfoProvider>
          <NotificationProvider navigationRef={navigationRef}>
            <AuthProvider>
              <UserProfileProvider>
                <MyActivityProvider>
                  <ThemeProvider>
                    {/* TODO: need to use themes' primary color but it's not working. */}
                    <StatusBar hidden={false} backgroundColor='#FF4D4D' />
                    <Navigator />
                    <NetInfoModal />
                  </ThemeProvider>
                </MyActivityProvider>
              </UserProfileProvider>
            </AuthProvider>
          </NotificationProvider>
        </NetInfoProvider>
      </NavigationContainer>
    </SafeAreaProvider>
    </I18nextProvider>
  )
}
