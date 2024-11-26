import { NavigationProp, useNavigation } from '@react-navigation/native'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../authentication/context/useAuth'
import { Platform } from 'react-native'
import { Cache } from 'aws-amplify/utils'
import { signOut } from 'aws-amplify/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SCREENS } from '../../../setup/constant/screens'
import { FetchResponse } from '../../../setup/clients/FetchClient'

interface User {
  name: string;
  location: string;
}

interface UserResponseData {
  success: boolean;
  data: {
    phoneNumbers: string[];
    name: string;
    bloodGroup: string;
    lastDonationDate: string;
    height: number;
    weight: number;
    gender: string;
    dateOfBirth: string;
    availableForDonation: string;
    NIDFront: string;
    NIDBack: string;
    lastVaccinatedDate: string;
    preferredDonationLocations: Array<{
      area: string;
      city: string;
      latitude: number;
      longitude: number;
    }>;
  };
  message: string;
}

interface UseAccountReturnType {
  userData: User | null;
  loading: boolean;
  error: string | null;
  handleSignOut: () => Promise<void>;
}

export const useAccount = (): UseAccountReturnType => {
  const auth = useAuth()
  const fetchClient = useFetchClient()
  const navigation = useNavigation<NavigationProp<any>>()
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearAllStorage = async(): Promise<void> => {
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
      console.error(
        'Error during sign out:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      if (error instanceof Error && error.name === 'UserNotAuthenticatedException') {
        navigation.navigate(SCREENS.WELCOME)
      }
    }
  }

  const fetchUserData = async(): Promise<void> => {
    setLoading(true)

    try {
      const response: FetchResponse<UserResponseData> = await fetchClient.get('/users')

      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} ${response.message ?? 'Unknown error'}`)
      }

      const { name, preferredDonationLocations } = response.data
      const location = `${preferredDonationLocations[0].city}, ${preferredDonationLocations[0].area}`
      setUserData({ name, location })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUserData()
  }, [])

  return { userData, loading, error, handleSignOut }
}
