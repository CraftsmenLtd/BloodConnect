import 'react-native-gesture-handler'
import '@react-native-firebase/app'
import { LogBox, StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, useNavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { NetInfoProvider } from './src/authentication/context/NetInfo'
import { NetInfoModal } from './src/components/NetInfoModal'
import { ThemeProvider } from './src/setup/theme/context/ThemeContext'
import Navigator from './src/setup/navigation/Navigator'
import { Amplify } from 'aws-amplify'
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito'
import { awsCognitoConfiguration } from './src/setup/config/cognito'
import { secureKeyValueStorage } from './src/utility/secureKeyValueStorage'
import { clearLegacyTokenStorage } from './src/utility/clearLegacyTokenStorage'
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
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { useTheme, useIsDark } from './src/setup/theme/hooks/useTheme'
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular'
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium'
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold'
import React, { useEffect } from 'react'

const ThemedStatusBar = () => {
  const theme = useTheme()

  return <StatusBar hidden={false} barStyle='light-content' backgroundColor={theme.colors.primary} />
}

const AppNavigator = ({ navigationRef }: { navigationRef: NavigationContainerRefWithCurrent<RootStackParamList> }) => {
  const theme = useTheme()
  const isDark = useIsDark()
  const base = isDark ? DarkTheme : DefaultTheme

  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.primary
    }
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <NetInfoProvider>
        <NotificationProvider navigationRef={navigationRef}>
          <AuthProvider>
            <UserProfileProvider>
              <MyActivityProvider>
                <ThemedStatusBar />
                <Navigator />
                <NetInfoModal />
              </MyActivityProvider>
            </UserProfileProvider>
          </AuthProvider>
        </NotificationProvider>
      </NetInfoProvider>
    </NavigationContainer>
  )
}

const { APP_ENV } = Constants.expoConfig?.extra ?? {}

if (APP_ENV !== 'development') {
  LogBox.ignoreAllLogs(true)
}

cognitoUserPoolsTokenProvider.setKeyValueStorage(secureKeyValueStorage)
Amplify.configure(awsCognitoConfiguration)
void clearLegacyTokenStorage()

// Keep the native splash up until the app fonts are loaded to avoid a font swap flash.
void SplashScreen.preventAutoHideAsync()

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
  const [fontsLoaded, fontError] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  // On font-load failure, render anyway and let text fall back to the system font.
  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <KeyboardProvider>
      <I18nextProvider i18n={i18n} >
        <SafeAreaProvider>
          <ThemeProvider>
            <AppNavigator navigationRef={navigationRef} />
          </ThemeProvider>
        </SafeAreaProvider>
      </I18nextProvider>
    </KeyboardProvider>
  )
}
