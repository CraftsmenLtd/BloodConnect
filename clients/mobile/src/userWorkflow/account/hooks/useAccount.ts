import { useNavigation } from '@react-navigation/native'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../authentication/context/useAuth'
import { Platform } from 'react-native'
import { Cache } from 'aws-amplify/utils'
import { SCREENS } from '../../../setup/constant/screens'
import type { FetchResponse } from '../../../setup/clients/FetchClient'
import type { AccountScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import type { LocationDTO, UserDetailsDTO } from '../../../../../../commons/dto/UserDTO'
import storageService from '../../../utility/storageService'
import { TOKEN } from '../../../setup/constant/token'

export type User = {
  location: string;
} & Omit<UserDetailsDTO, 'email' | 'age' | 'createdAt' | 'updatedAt' | 'deviceToken' | 'snsEndpointArn'>

export type UserResponseData = {
  success: boolean;
  data: {
    preferredDonationLocations: Array<Omit<LocationDTO, 'userId' | 'locationId' | 'geohash' | 'createdAt'>>;
    message: string;
  } & Omit<UserDetailsDTO, 'email' | 'age' | 'createdAt' | 'updatedAt' | 'deviceToken' | 'snsEndpointArn'>;
}

type UseAccountReturnType = {
  userProfileData: User | null;
  loading: boolean;
  error: string | null;
  handleSignOut: () => Promise<void>;
}

export const useAccount = (): UseAccountReturnType => {
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
    } catch (_error) {
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
        const { area = '' } = preferredDonationLocations[0]
        const location = `${area}`
        setUserProfileData({ ...userData, location })
      }
    } catch (_err) {
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
