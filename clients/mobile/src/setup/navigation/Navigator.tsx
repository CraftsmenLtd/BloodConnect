import React, { useEffect } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { routes } from './routes'
import { SCREENS } from '../constant/screens'
import { useAuth } from '../../authentication/context/useAuth'
import Loader from '../../components/loaders/loader'
import { View, StyleSheet } from 'react-native'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'
import type { Theme } from '../theme'
import { useTheme } from '../theme/hooks/useTheme'

const Stack = createStackNavigator()

export default function Navigator() {
  const { isAuthenticated, loading } = useAuth()
  const { userProfile, fetchUserProfile, loading: profileLoading } = useUserProfile()
  const styles = createStyles(useTheme())

  useEffect(() => {
    if (isAuthenticated) {
      void fetchUserProfile()
    }
  }, [isAuthenticated])

  if (loading || (isAuthenticated && profileLoading)) {
    return (
      <View style={styles.container}>
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
      {filteredRoutes.map(({ name, component, options }) => (
        <Stack.Screen key={name} name={name} component={component} options={options} />
      ))
      }

    </Stack.Navigator>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  comingSoonText: {
    fontSize: 20,
    padding: 10,
    lineHeight: 30,
    fontWeight: 'bold',
    color: theme.colors.black,
    textAlign: 'center'
  },
  logoTitleContainer: {
    position: 'absolute',
    top: 80,
    alignItems: 'center',
    zIndex: 1
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.primary,
    borderRadius: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 10
  },
})
