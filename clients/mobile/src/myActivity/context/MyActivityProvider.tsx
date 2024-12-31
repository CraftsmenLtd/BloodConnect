import React, { createContext, ReactNode, useEffect } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { fetchDonationList } from '../../donationWorkflow/donationService'
import { DonationData, extractErrorMessage, formatDonations } from '../../donationWorkflow/donationHelpers'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'
import useFetchData from '../../setup/clients/useFetchData'
import storageService from '../../utility/storageService'
import { UserProfile } from '../../userWorkflow/services/userProfileService'
import LOCAL_STORAGE_KEYS from '../../setup/constant/localStorageKeys'
import { useAuth } from '../../authentication/context/useAuth'

export interface MyActivityContextType {
  donationPosts: DonationData[];
  errorMessage: string | null;
  loading: boolean;
  fetchDonationPosts: () => Promise<void>;
}

const defaultContextValue = {
  donationPosts: [],
  errorMessage: null,
  loading: false,
  fetchDonationPosts: async() => { }
}

export const MyActivityContext = createContext<MyActivityContextType>(defaultContextValue)

export const MyActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userProfile } = useUserProfile()
  const { isAuthenticated } = useAuth()
  const fetchClient = useFetchClient()

  const [fetchDonationPosts, loading, data, errorMessage] = useFetchData(async() => {
    const response = await fetchDonationList({}, fetchClient)

    if (response.data !== undefined && response.data.length > 0) {
      const profile = await storageService.getItem<UserProfile>(LOCAL_STORAGE_KEYS.USER_PROFILE)
      const userName = userProfile.name === '' ? profile?.name : userProfile.name
      return formatDonations(response.data, userName)
    }
    return []
  }, { parseError: extractErrorMessage })

  useEffect(() => {
    void fetchDonationPosts()
  }, [isAuthenticated])

  return (
    <MyActivityContext.Provider value={{ donationPosts: data ?? [], errorMessage, loading, fetchDonationPosts }}>
      {children}
    </MyActivityContext.Provider>
  )
}
