import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { fetchDonationList } from '../../donationWorkflow/donationService'
import { DonationData, formatDonations, extractErrorMessage } from '../../donationWorkflow/donationHelpers'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'

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
  const [donationPosts, setDonationPosts] = useState<DonationData[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const fetchClient = useFetchClient()

  useEffect(() => { void fetchDonationPosts() }, [userProfile])

  const fetchDonationPosts = async(): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetchDonationList({}, fetchClient)
      if (response.data !== undefined && response.data.length > 0) {
        const formattedDonations = formatDonations(response.data, userProfile.name)
        setDonationPosts(formattedDonations)
      } else {
        setDonationPosts([])
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setErrorMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MyActivityContext.Provider value={{ donationPosts, errorMessage, loading, fetchDonationPosts }}>
      {children}
    </MyActivityContext.Provider>
  )
}
