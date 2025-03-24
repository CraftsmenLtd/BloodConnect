import { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { SCREENS } from '../../setup/constant/screens'
import type { DonationPostsScreenNavigationProp } from '../../setup/navigation/navigationTypes'
import { extractErrorMessage, formatDonations } from '../donationHelpers'
import type { BloodDonationRecord } from '../types'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { fetchDonationPublicPosts } from '../donationService'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

export const useDonationPosts = () => {
  const navigation = useNavigation<DonationPostsScreenNavigationProp>()
  const fetchClient = useFetchClient()
  const [donationPosts, setDonationPosts] = useState<DonationData[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState(false)
  const { userProfile } = useUserProfile()
  const [isFilteredByBloodGroup, setIsFilteredByBloodGroup] = useState(false)

  useEffect(() => { void fetchPosts() }, [])

  const fetchDonations = async (bloodGroup: string = ''): Promise<void> => {
    const results = await Promise.allSettled(
      userProfile.uniqueGeoPartitions.map(async(eachPartition) => {
        const response = await fetchDonationPublicPosts(eachPartition, fetchClient, bloodGroup)
        return (response.data != null) ? formatDonations(response.data) : []
      })
    )

    const formattedDonations = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => (result as PromiseFulfilledResult<DonationData[]>).value)

    formattedDonations.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setDonationPosts(formattedDonations)
  }

  const fetchPosts = async (): Promise<void> => {
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

  const refreshPosts = async (): Promise<void> => {
    setIsFilteredByBloodGroup(false)
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }

  const createPost = (): void => {
    navigation.navigate(SCREENS.DONATION, { data: null, isUpdating: false })
  }

  const filterWithBloodGroup = async (): Promise<void> => {
    setLoading(true)
    setIsFilteredByBloodGroup(true)
    try {
      await fetchDonations(userProfile.bloodGroup)
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
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
    refreshing,
    bloodGroup: userProfile.bloodGroup,
    isFilteredByBloodGroup,
    filterWithBloodGroup
  }
}
