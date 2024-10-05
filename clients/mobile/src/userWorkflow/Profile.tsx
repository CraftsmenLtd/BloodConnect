/* eslint-disable */
// This page is not implemented yet just demo.
import React from 'react'
import { Text, Button, View, StyleSheet } from 'react-native'
import { signOut } from 'aws-amplify/auth'
import { useTheme } from '../setup/theme/hooks/useTheme'
import { ProfileScreenNavigationProp } from '../setup/navigation/navigationTypes'
import { SCREENS } from '../setup/constant/screens'

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export default function Profile({ navigation }: ProfileScreenProps) {
  const theme = useTheme()

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut()
      navigation.navigate(SCREENS.PROFILE)
    } catch (error) {
      console.error('Error signing out:', error)
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
