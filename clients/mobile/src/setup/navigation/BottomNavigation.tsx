import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Profile from '../../userWorkflow/Profile'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../../userWorkflow/HomeScreen'
import DonationPosts from '../../donationWorkflow/donationPosts/DonationPosts'
import MyActivityTab from '../../userWorkflow/MyActivityTab'
import { SCREENS } from '../constant/screens'
// import AddPersonalInfo from '../../userWorkflow/personalInfo/UI/AddPersonalInfo'

const Tab = createBottomTabNavigator()

const BottomNavigation = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name={SCREENS.HOME} component={HomeScreen} options={{
        headerTitle: 'Home',
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home-outline" color={color} size={size} />
        )
      }} />
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
      <Tab.Screen name={SCREENS.PROFILE} component={Profile} options={{
        headerTitle: 'Profile',
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="person-outline" color={color} size={size} />
        )
      }} />

    </Tab.Navigator>
  )
}

export default BottomNavigation
