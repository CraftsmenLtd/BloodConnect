import { useNavigation } from '@react-navigation/native'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../authentication/context/useAuth'
import { Platform } from 'react-native'
import { Cache } from 'aws-amplify/utils'
import { SCREENS } from '../../../setup/constant/screens'
import { FetchResponse } from '../../../setup/clients/FetchClient'
import { AccountScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { LocationDTO, UserDetailsDTO } from '../../../../../../commons/dto/UserDTO'
import { useUserProfile } from '../../context/UserProfileContext'
import storageService from '../../../utility/storageService'
import { TOKEN } from '../../../setup/constant/token'

export interface User extends
  Omit<UserDetailsDTO, 'email' | 'age' | 'createdAt' | 'updatedAt' | 'deviceToken' | 'snsEndpointArn'> {
  location: string;
}

export interface UserResponseData {
  success: boolean;
  data: {
    preferredDonationLocations: Array<Omit<LocationDTO, 'userId' | 'locationId' | 'geohash' | 'createdAt'>>;
    message: string;
  } & Omit<UserDetailsDTO, 'email' | 'age' | 'createdAt' | 'updatedAt' | 'deviceToken' | 'snsEndpointArn'>;
}

interface UseAccountReturnType {
  userProfileData: User | null;
  loading: boolean;
  error: string | null;
  handleSignOut: () => Promise<void>;
}

export const useAccount = (): UseAccountReturnType => {
  const { userProfile } = useUserProfile()

  const auth = useAuth()
  const fetchClient = useFetchClient()
  const navigation = useNavigation<AccountScreenNavigationProp>()
  const [userProfileData, setUserProfileData] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearStorageExceptDeviceToken = async(): Promise<void> => {
    if (Platform.OS !== 'web') {
      const keys = await storageService.getAllKeys()
      const filteredKeys = keys.filter(TOKEN.DEVICE_TOKEN)
      await filteredKeys.remove()
    }
  }

  const handleSignOut = async(): Promise<void> => {
    try {
      await Promise.all([Cache.clear(), clearStorageExceptDeviceToken()])
      await auth.logoutUser()
      navigation.navigate(SCREENS.WELCOME)
    } catch (error) {
      throw new Error('Something went wrong')
    }
  }

  const fetchUserData = async(): Promise<void> => {
    try {
      const response: FetchResponse<UserResponseData> = await fetchClient.get('/users')

      if (response.status !== 200) {
        throw new Error('Could not fetch user data')
      }

      const { preferredDonationLocations, ...userData } = response.data

      if (preferredDonationLocations.length > 0) {
        const { city = '', area = '' } = preferredDonationLocations[0]
        const location = `${city}, ${area}`
        setUserProfileData({ ...userData, location })
      }
    } catch (err) {
      setError('An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUserData()
  }, [])

  return { userProfileData, loading, error, handleSignOut }
}
