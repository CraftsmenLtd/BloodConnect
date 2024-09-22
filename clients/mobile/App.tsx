import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import RegisterScreen from './src/authentication/register/UI/RegisterScreen'
import { ThemeProvider } from './src/context/ThemeContext'

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <RegisterScreen />
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
