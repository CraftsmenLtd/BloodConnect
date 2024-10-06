import 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from './src/setup/theme/context/ThemeContext'
import Navigator from './src/setup/navigation/Navigator'
import { Amplify } from 'aws-amplify'
// import { awsCognitoConfiguration } from './src/setup/config/cognito'
import Constants from 'expo-constants'
const { AWS_USER_POOL_ID, AWS_USER_POOL_CLIENT_ID, AWS_COGNITO_DOMAIN } = Constants.expoConfig?.extra ?? {}

// Amplify.configure(awsCognitoConfiguration)

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: AWS_USER_POOL_ID,
      userPoolClientId: AWS_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: AWS_COGNITO_DOMAIN,
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: ['myapp://callback'],
          redirectSignOut: ['myapp://signout'],
          providers: ['Google'],
          responseType: 'code'
        }
      }
    }
  }
})

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Navigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
