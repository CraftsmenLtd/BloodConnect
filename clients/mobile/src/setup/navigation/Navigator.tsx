import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { routes } from './routes'
import { SCREENS } from '../constant/screens'

const Stack = createStackNavigator()

export default function Navigator() {
  return (
    <Stack.Navigator initialRouteName={SCREENS.WELCOME} screenOptions={{
      headerStyle: {
        height: 75
      },
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: 20
      }
    }}>
      {routes.map(({ name, component, options }) => {
        return <Stack.Screen key={name} name={name} component={component} options={options} />
      })}
    </Stack.Navigator>
  )
}
