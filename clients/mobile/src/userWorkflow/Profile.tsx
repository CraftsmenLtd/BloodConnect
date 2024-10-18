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
import { useAuth } from '../authentication/useAuth'
import { loadIdToken } from '../authentication/authService'

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const donationData = {
  patientName: 'John Doe',
  neededBloodGroup: 'O-',
  bloodQuantity: '2 Bags',
  urgencyLevel: 'urgent',
  location: 'Baridhara, Dhaka',
  latitude: 23.7936,
  longitude: 90.4043,
  donationDateTime: '2024-10-28T15:30:00Z',
  contactNumber: '+880123456789',
  transportationInfo: 'Car available',
  shortDescription: 'Need blood urgently for surgery.'
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

  const createPost = () => {
    navigation.navigate(SCREENS.DONATION, { data: null, isUpdating: false })
  }



  const updatePost = (donationData) => {
    navigation.navigate(SCREENS.DONATION, { data: { seekerId: 'lkjhasdfka-qrwerie-sfsdl6usdf', requestPostId: '01JAQJERPBPJ2932BZEKK32GV9', ...donationData }, isUpdating: true })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Page</Text>
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        color={theme.colors.primary}
      />
      <Button
        title="Create Post"
        onPress={createPost}
        color={theme.colors.primary}
      />

      <Button
        title="Update Post"
        onPress={() => updatePost(donationData)}
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
