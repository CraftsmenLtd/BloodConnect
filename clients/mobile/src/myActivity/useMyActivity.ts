import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { BloodDonationRecord } from '../donationWorkflow/types'
import { SCREENS } from '../setup/constant/screens'
import { DonationPostsScreenNavigationProp } from '../setup/navigation/navigationTypes'
import { fetchMyResponses, cancelDonation } from '../donationWorkflow/donationService'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { extractErrorMessage, formatDonations } from '../donationWorkflow/donationHelpers'
import { TabConfig } from './types'
import { useUserProfile } from '../userWorkflow/context/UserProfileContext'
import useFetchData from '../setup/clients/useFetchData'
import useToast from '../components/toast/useToast'

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
  const { showToastMessage, showToast, toastAnimationFinished } = useToast()
  const navigation = useNavigation<DonationPostsScreenNavigationProp>()
  const [currentTab, setCurrentTab] = useState(MY_ACTIVITY_TAB_CONFIG.initialTab)
  const [cancelPostError, setCancelPostError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [getMyResponses, myResponsesLoading, myResponses, myResponsesError] = useFetchData(async() => {
    const response = await fetchMyResponses({}, fetchClient)
    if (response.data !== undefined && response.data.length > 0) {
      return formatDonations(response.data)
    }
    return []
  }, { shouldExecuteOnMount: true, parseError: extractErrorMessage })

  const updatePost = (donationData: DonationData): void => {
    const { status, acceptedDonors, ...rest } = donationData
    navigation.navigate(SCREENS.DONATION, { data: rest, isUpdating: true })
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
      const response = await cancelDonation(payload, fetchClient)
      if (response.success === true) {
        showToastMessage({ message: response.message ?? '', type: 'success', toastAnimationFinished })
      }
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
    showToast,
    handleRefresh: refreshPosts,
    refreshing
  }
}
