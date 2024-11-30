import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { routes } from './routes'
import { SCREENS } from '../constant/screens'
import { useAuth } from '../../authentication/context/useAuth'
import { View } from 'react-native'
import Loader from '../../components/loaders/loader'

const Stack = createStackNavigator()

export default function Navigator() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader size="large" />
      </View>
    )
  }

  const filteredRoutes = routes.filter(route => {
    return !route.protected || isAuthenticated
  })

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? SCREENS.BOTTOM_TABS : SCREENS.WELCOME}
      screenOptions={{
        headerStyle: {
          height: 75
        },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 20
        }
      }}
    >
      {filteredRoutes.map(({ name, component, options }) => (
        <Stack.Screen key={name} name={name} component={component} options={options} />
      ))}
      {/* <Stack.Screen
        name={SCREENS.BLOOD_REQUEST_PREVIEW}
        component={ResponseDonationRequest}
        options={{ headerTitle: 'Blood Request' }}
      /> */}
    </Stack.Navigator>
  )
}
