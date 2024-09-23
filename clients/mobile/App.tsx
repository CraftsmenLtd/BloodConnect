import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from './src/theme/context/ThemeContext'
import Navigator from './src/setup/navigation/Navigator'
import { Amplify } from 'aws-amplify'
import { awsCognitoConfiguration } from './src/setup/config/cognito'

Amplify.configure(awsCognitoConfiguration)

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
