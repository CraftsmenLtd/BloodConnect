import { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { BloodDonationRecord } from '../donationWorkflow/types'
import { SCREENS } from '../setup/constant/screens'
import { DonationPostsScreenNavigationProp } from '../setup/navigation/navigationTypes'
import { fetchMyResponses, cancelDonation } from '../donationWorkflow/donationService'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { extractErrorMessage, formatDonations } from '../donationWorkflow/donationHelpers'
import { TabConfig } from './types'
import { useUserProfile } from '../userWorkflow/context/UserProfileContext'

export const MY_ACTIVITY_TAB_CONFIG: TabConfig = {
  tabs: ['My Posts', 'My Responses'],
  initialTab: 'My Posts'
}

export interface DonationData extends Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> {
  requestPostId: string;
}

export const useMyActivity = (): any => {
  const fetchClient = useFetchClient()
  const { userProfile } = useUserProfile()
  const navigation = useNavigation<DonationPostsScreenNavigationProp>()
  const [currentTab, setCurrentTab] = useState(MY_ACTIVITY_TAB_CONFIG.initialTab)
  const [myResponses, setMyResponses] = useState<DonationData[]>([])
  const [myResponsesLoading, setMyResponsesLoading] = useState(false)
  const [myResponsesError, setMyResponsesError] = useState<string | null>(null)
  const [cancelPostError, setCancelPostError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { void getMyResponses() }, [])

  const getMyResponses = async(): Promise<void> => {
    setMyResponsesLoading(true)
    try {
      const response = await fetchMyResponses({}, fetchClient)
      if (response.data !== undefined && Array.isArray(response.data)) {
        const formattedDonations = formatDonations(response.data)
        setMyResponses(formattedDonations)
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setMyResponsesError(errorMessage)
    } finally {
      setMyResponsesLoading(false)
    }
  }

  const updatePost = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
  }

  const detailHandler = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DETAIL_POST, { data: { ...donationData, patientName: userProfile.name } })
  }

  const cancelPost = async(donationData: DonationData): Promise<void> => {
    const payload = {
      reqPostId: donationData.requestPostId,
      requestedCreatedAt: donationData.createdAt
    }

    try {
      await cancelDonation(payload, fetchClient)
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setCancelPostError(errorMessage)
    }
  }

  const handleTabPress = (tab: string): void => {
    setCurrentTab(tab)
  }

  const refreshPosts = async(): Promise<void> => {
    setRefreshing(true)
    await getMyResponses()
    setRefreshing(false)
  }

  return {
    currentTab,
    handleTabPress,
    updatePost,
    detailHandler,
    cancelPost,
    myResponses,
    myResponsesLoading,
    myResponsesError,
    cancelPostError,
    handleRefresh: refreshPosts,
    refreshing
  }
}
