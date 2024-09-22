import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { routes } from './routes'

const Stack = createStackNavigator()

export default function Navigator() {
  return (
    <Stack.Navigator initialRouteName="Register" screenOptions={{
      headerStyle: {
        height: 70
      },
      headerTitleAlign: 'center'
    }}>
      {routes.map(({ name, component, options, protected: isProtected }) => {
        return <Stack.Screen key={name} name={name} component={component} options={options} />
      })}
    </Stack.Navigator>
  )
}
