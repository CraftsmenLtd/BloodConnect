import { useNavigation } from '@react-navigation/native'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../authentication/context/useAuth'
import { Platform } from 'react-native'
import { Cache } from 'aws-amplify/utils'
import { SCREENS } from '../../../setup/constant/screens'
import { FetchResponse } from '../../../setup/clients/FetchClient'
import { AccountScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { UserResponseData } from '../../../../../../commons/dto/UserDTO'
import storageService from '../../../utility/storageService'
import { TOKEN } from '../../../setup/constant/token'

interface User {
  name: string;
  location: string;
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
  const navigation = useNavigation<AccountScreenNavigationProp>()
  const [userData, setUserData] = useState<User | null>(null)
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

      const { name, preferredDonationLocations } = response.data

      if (preferredDonationLocations.length > 0) {
        const { city = '', area = '' } = preferredDonationLocations[0]
        const location = `${city}, ${area}`
        setUserData({ name, location })
      } else {
        const location = ''
        setUserData({ name, location })
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

  return { userData, loading, error, handleSignOut }
}
