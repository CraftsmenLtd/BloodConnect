import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text, View, TouchableOpacity, Platform, Image, ImageStyle, StyleProp, ActivityIndicator } from 'react-native'
import { signOut } from 'aws-amplify/auth'
import { ProfileScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import { Cache } from 'aws-amplify/utils'
import { useAuth } from '../../../authentication/context/useAuth'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import createStyles from './createStyle'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
// import { FetchResponse } from '../../../setup/clients/FetchClient'
import { NavigationProp, useNavigation } from '@react-navigation/native'

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface DonationLocation {
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface FetchResponse {
  status: number;
  statusText?: string;
}

interface User {
  name: string;
  bloodGroup: string;
  lastDonationDate: string;
  height: number;
  weight: number;
  gender: string;
  dateOfBirth: string;
  availableForDonation: string;
  phoneNumbers: string[];
  NIDFront: string;
  NIDBack: string;
  lastVaccinatedDate: string;
  preferredDonationLocations: DonationLocation[];
}

export const Account = () => {
  const navigation = useNavigation<NavigationProp<any>>()
  const auth = useAuth()
  const styles = createStyles(useTheme())
  const fetchClient = useFetchClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearAllStorage = async() => {
    if (Platform.OS !== 'web') {
      await AsyncStorage.clear()
    }
  }

  const handleSignOut = async(): Promise<void> => {
    try {
      await auth.logoutUser()
      await Promise.all([Cache.clear(), clearAllStorage()])
      await signOut()
      navigation.navigate(SCREENS.WELCOME)
    } catch (error) {
      console.error('Error during sign out:', error instanceof Error ? error.message : 'Unknown error')
      if (error instanceof Error && error.name === 'UserNotAuthenticatedException') {
        navigation.navigate(SCREENS.WELCOME)
      }
    }
  }

  const fetchUserData = async(): Promise<void> => {
    try {
      const response: FetchResponse = await fetchClient.get('/users')
      console.log('response: ', JSON.stringify(response))

      if (response.status !== 200) {
        const errorMessage = `Error: ${response.status} ${response.statusText ?? 'Unknown error'}`
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      // if (responseData.success) {
      //   setUser(responseData.data) // Store the user data
      // } else {
      //   throw new Error(responseData.message ?? 'Failed to retrieve user data')
      // }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUserData()
  }, [])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={styles.loaderColor} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.imageOuterBorder}>
          <View style={styles.imageInnerBorder}>
            <Image
              style={styles.profileImage as StyleProp<ImageStyle>}
              source={{ uri: 'https://images.unsplash.com/photo-1603005901058-02e1cfc65270?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }} // Replace with the actual image URL
            />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Sufi Ahmed</Text>
          <View style={styles.profileLocationSection}>
            <MaterialIcons name="location-on" size={16} style={styles.iconStyle} />
            <Text style={styles.profileLocation}>Mohakhali DOHS, Dhaka</Text>
          </View>
        </View>
      </View>

      <View style={styles.optionsSection}>
        <TouchableOpacity style={styles.optionItem} onPress={() => { navigation.navigate(SCREENS.PROFILE) }}>
          <MaterialIcons name="person-outline" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Profile</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="bloodtype" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Donor Information</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="notifications-none" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.moreSection}>
        <Text style={styles.moreText}>More</Text>
        <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="star-border" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Rate & Review</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="help-outline" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Help</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={() => { void handleSignOut() }}>
          <MaterialIcons name="logout" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>

  )
}

export default Account
