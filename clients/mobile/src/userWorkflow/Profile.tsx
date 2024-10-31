/* eslint-disable */
// This page is not implemented yet just demo.
import React from 'react'
import { Text, Button, View, StyleSheet } from 'react-native'
import { signOut } from 'aws-amplify/auth'
import { useTheme } from '../setup/theme/hooks/useTheme'
import { ProfileScreenNavigationProp } from '../setup/navigation/navigationTypes'
import { SCREENS } from '../setup/constant/screens'
import { Cache } from 'aws-amplify/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useAuth } from '../authentication/context/useAuth'

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export default function Profile({ navigation }: ProfileScreenProps) {
  const theme = useTheme()
  const auth = useAuth()

  const clearAllStorage = async () => {
    if (Platform.OS !== 'web') {
      await AsyncStorage.clear();
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await auth.logoutUser()
      await Promise.all([Cache.clear(), clearAllStorage()])
      await signOut()
      navigation.navigate(SCREENS.WELCOME)
    } catch (error) {
      console.error('Error during sign out:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.name === 'UserNotAuthenticatedException') {
        navigation.navigate(SCREENS.WELCOME);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Page</Text>
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        color={theme.colors.primary}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  }
})
