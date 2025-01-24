import React, { useEffect } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { routes } from './routes'
import { SCREENS } from '../constant/screens'
import { useAuth } from '../../authentication/context/useAuth'
import Loader from '../../components/loaders/loader'
import { View } from 'react-native'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'
import NoInternetScreen from '../../components/NoInternetScreen'
import { useInternetConnection } from '../../hooks/useInternetConnection'

const Stack = createStackNavigator()

export default function Navigator() {
  const { isAuthenticated, loading } = useAuth()
  const { userProfile, fetchUserProfile, loading: profileLoading } = useUserProfile()
  const { isConnected, checkConnection } = useInternetConnection()

  useEffect(() => {
    if (isAuthenticated) {
      void fetchUserProfile()
    }
  }, [isAuthenticated])

  if (loading || (isAuthenticated && profileLoading) || isConnected === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader size="large" />
      </View>
    )
  }

  const filteredRoutes = routes.filter(route => {
    return !route.protected || isAuthenticated
  })

  const getInitialRoute = () => {
    if (!isAuthenticated) {
      return SCREENS.WELCOME
    }
    const hasProfile = Boolean(userProfile?.bloodGroup)
    return hasProfile ? SCREENS.BOTTOM_TABS : SCREENS.ADD_PERSONAL_INFO
  }

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
    >
      {!isConnected &&
        <Stack.Screen
          name={SCREENS.NO_INTERNET}
          children={() => <NoInternetScreen onRetry={checkConnection} isConnected={isConnected} />}
          options={{ headerShown: false }}
        />}
      {filteredRoutes.map(({ name, component, options }) => (
        <Stack.Screen key={name} name={name} component={component} options={options} />
      ))
      }

    </Stack.Navigator>
  )
}
