import { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { SCREENS } from '../../setup/constant/screens'
import { DonationPostsScreenNavigationProp } from '../../setup/navigation/navigationTypes'
import { extractErrorMessage, formatDonations } from '../donationHelpers'
import { BloodDonationRecord } from '../types'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { fetchDonationPublicPosts } from '../donationService'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

export const useDonationPosts = (): any => {
  const navigation = useNavigation<DonationPostsScreenNavigationProp>()
  const fetchClient = useFetchClient()
  const [donationPosts, setDonationPosts] = useState<DonationData[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState(false)
  const { userProfile } = useUserProfile()

  useEffect(() => { void fetchPosts() }, [])

  const fetchDonations = async(): Promise<void> => {
    const response = await fetchDonationPublicPosts(userProfile.city, fetchClient)
    if (response.data !== undefined && response.data.length > 0) {
      const formattedDonations = formatDonations(response.data)
      setDonationPosts(formattedDonations)
    }
  }

  const fetchPosts = async(): Promise<void> => {
    setLoading(true)
    try {
      await fetchDonations()
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  const refreshPosts = async(): Promise<void> => {
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }

  const createPost = (): void => {
    navigation.navigate(SCREENS.DONATION, { data: null, isUpdating: false })
  }

  const viewDetailsHandler = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.BLOOD_REQUEST_PREVIEW, { notificationData: donationData })
  }

  return {
    errorMessage,
    createPost,
    donationPosts,
    loading,
    viewDetailsHandler,
    handleRefresh: refreshPosts,
    refreshing
  }
}
