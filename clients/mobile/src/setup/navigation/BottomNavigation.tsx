import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import DonationPosts from '../../donationWorkflow/donationPosts/DonationPosts'
import MyActivityTab from '../../userWorkflow/MyActivityTab'
import { SCREENS } from '../constant/screens'
import Account from '../../userWorkflow/account/UI/Account'
import { useTheme } from '../theme/hooks/useTheme'

const Tab = createBottomTabNavigator()

const BottomNavigation = () => {
  const { colors } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          height: 104
        },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 20
        },
        tabBarActiveTintColor: colors.primary
      }}
    >
      <Tab.Screen name={SCREENS.POSTS} component={DonationPosts} options={{
        headerTitle: 'Posts',
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="document-text-outline" color={color} size={size} />
        )
      }} />
      <Tab.Screen name={SCREENS.MY_ACTIVITY} component={MyActivityTab} options={{
        headerTitle: 'My Activity',
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="analytics-outline" color={color} size={size} />
        )
      }} />
      <Tab.Screen name={SCREENS.ACCOUNT} component={Account} options={{
        headerTitle: 'Account',
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name='person' color={color} size={size} />
        )
      }} />

    </Tab.Navigator>
  )
}

export default BottomNavigation
