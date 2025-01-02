import React, { createContext, ReactNode, useCallback, useEffect } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { fetchDonationList, fetchMyResponses } from '../../donationWorkflow/donationService'
import { DonationData, extractErrorMessage, formatDonations } from '../../donationWorkflow/donationHelpers'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'
import useFetchData from '../../setup/clients/useFetchData'
import storageService from '../../utility/storageService'
import { UserProfile } from '../../userWorkflow/services/userProfileService'
import LOCAL_STORAGE_KEYS from '../../setup/constant/localStorageKeys'
import { useAuth } from '../../authentication/context/useAuth'

export interface MyActivityContextType {
  donationPosts: DonationData[];
  myResponses: DonationData[];
  errorMessage: string | null;
  myResponsesError: string | null;
  loading: boolean;
  myResponsesLoading: boolean;
  fetchDonationPosts: () => Promise<void>;
  getMyResponses: () => Promise<void>;
}

const defaultContextValue = {
  donationPosts: [],
  myResponses: [],
  errorMessage: null,
  myResponsesError: null,
  loading: false,
  myResponsesLoading: false,
  fetchDonationPosts: async() => { },
  getMyResponses: async() => { }
}

export const MyActivityContext = createContext<MyActivityContextType>(defaultContextValue)

export const MyActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userProfile } = useUserProfile()
  const { isAuthenticated } = useAuth()
  const fetchClient = useFetchClient()

  const fetchMyResponsesCallback = useCallback(async() => {
    const response = await fetchMyResponses({}, fetchClient)
    if (response.data !== undefined && response.data.length > 0) {
      return formatDonations(response.data)
    }
    return []
  }, [fetchClient])

  const [getMyResponses, myResponsesLoading, myResponses, myResponsesError] = useFetchData(fetchMyResponsesCallback, {
    parseError: extractErrorMessage
  })

  const fetchDonationPostsCallback = useCallback(async() => {
    const response = await fetchDonationList({}, fetchClient)
    if (response.data !== undefined && response.data.length > 0) {
      const profile = await storageService.getItem<UserProfile>(LOCAL_STORAGE_KEYS.USER_PROFILE)
      const userName = userProfile.name === '' ? profile?.name : userProfile.name
      return formatDonations(response.data, userName)
    }
    return []
  }, [fetchClient, userProfile.name])

  const [fetchDonationPosts, loading, data, errorMessage] = useFetchData(fetchDonationPostsCallback, {
    parseError: extractErrorMessage
  })

  useEffect(() => {
    if (isAuthenticated) {
      void fetchDonationPosts()
      void getMyResponses()
    }
  }, [isAuthenticated, fetchDonationPosts, getMyResponses])

  return (
    <MyActivityContext.Provider
      value={{
        donationPosts: data ?? [],
        myResponses: myResponses ?? [],
        myResponsesLoading,
        myResponsesError,
        errorMessage,
        loading,
        fetchDonationPosts,
        getMyResponses
      }}
    >
      {children}
    </MyActivityContext.Provider>
  )
}
