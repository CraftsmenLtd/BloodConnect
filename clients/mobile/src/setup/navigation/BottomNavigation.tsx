import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import DonationPosts from '../../donationWorkflow/donationPosts/DonationPosts'
import MyActivityTab from '../../myActivity/MyActivityTab'
import { SCREENS } from '../constant/screens'
import Account from '../../userWorkflow/account/UI/Account'
import { useTheme } from '../theme/hooks/useTheme'

const Tab = createBottomTabNavigator()

const BottomNavigation = () => {
  const { colors } = useTheme()
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 20
        },
        tabBarActiveTintColor: colors.primary
      }}
    >
      <Tab.Screen name={SCREENS.POSTS} component={DonationPosts} options={{
        headerTitle: t('navBar.requests'),
        headerShown: true,
        tabBarLabel: t('navBar.requests'),
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="document-text-outline" color={color} size={size} />
        )
      }} />
      <Tab.Screen name={SCREENS.MY_ACTIVITY} component={MyActivityTab} options={{
        headerTitle: t('navBar.myActivity'),
        headerShown: true,
        tabBarLabel: t('navBar.myActivity'),
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="analytics-outline" color={color} size={size} />
        )
      }} />
      <Tab.Screen name={SCREENS.ACCOUNT} component={Account} options={{
        headerTitle: t('navBar.account'),
        headerShown: true,
        tabBarLabel: t('navBar.account'),
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name='person' color={color} size={size} />
        )
      }} />

    </Tab.Navigator>
  )
}

export default BottomNavigation
