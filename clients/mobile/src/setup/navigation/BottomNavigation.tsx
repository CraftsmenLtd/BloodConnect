import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import HomeScreen from '../../userWorkflow/HomeScreen'
import DonationPosts from '../../donationWorkflow/donationPosts/DonationPosts'
import MyActivityTab from '../../userWorkflow/MyActivityTab'
import Account from '../../userWorkflow/Accounts'

const Tab = createBottomTabNavigator()

const BottomNavigation = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name='Home' component={HomeScreen} options={{
        headerTitle: 'Home',
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home-outline" color={color} size={size} />
        )
      }} />
      <Tab.Screen name='Posts' component={DonationPosts} options={{
        headerTitle: 'Posts',
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="document-text-outline" color={color} size={size} />
        )
      }} />
      <Tab.Screen name='MyActivity' component={MyActivityTab} options={{
        headerTitle: 'My Activity',
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="analytics-outline" color={color} size={size} />
        )
      }} />
      <Tab.Screen name='Account' component={Account} options={{
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
