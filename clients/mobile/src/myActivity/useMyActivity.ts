import { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { BloodDonationRecord } from '../donationWorkflow/types'
import { STATUS } from '../donationWorkflow/types'
import { SCREENS } from '../setup/constant/screens'
import type { DonationPostsScreenNavigationProp } from '../setup/navigation/navigationTypes'
import { cancelDonation } from '../donationWorkflow/donationService'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { extractErrorMessage } from '../donationWorkflow/donationHelpers'
import type { TabConfig } from './types'
import useToast from '../components/toast/useToast'
import { useMyActivityContext } from './context/useMyActivityContext'

export const MY_ACTIVITY_TAB_CONFIG: TabConfig = {
  tabs: ['My Requests', 'My Responses'],
  initialTab: 'My Requests'
}

export type DonationData = {
  requestPostId: string;
} & Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'>

export const useMyActivity = () => {
  const fetchClient = useFetchClient()
  const { fetchDonationPosts, getMyResponses } = useMyActivityContext()
  const { showToastMessage, showToast, toastAnimationFinished } = useToast()
  const navigation = useNavigation<DonationPostsScreenNavigationProp>()
  const [currentTab, setCurrentTab] = useState(MY_ACTIVITY_TAB_CONFIG.initialTab)
  const [cancelPostError, setCancelPostError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => {
      void refreshPosts()
    }, [])
  )

  const updatePost = (donationData: DonationData): void => {

    const { status, acceptedDonors, ...rest } = donationData
    navigation.navigate(SCREENS.DONATION, { data: rest, isUpdating: true })
  }

  const detailHandler = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DETAIL_POST, { data: { ...donationData } })
  }

  const myResponsesDetailHandler = (data: DonationData): void => {
    navigation.navigate(SCREENS.DETAIL_POST, { data: { ...data }, useAsDetailsPage: true })
  }

  const cancelPost = async(donationData: DonationData): Promise<void> => {
    setIsLoading(true)
    const payload = {
      requestPostId: donationData.requestPostId,
      requestCreatedAt: donationData.createdAt
    }

    const previousStatus = donationData.status
    donationData.status = STATUS.CANCELLED

    try {
      const response = await cancelDonation(payload, fetchClient)
      if (response.success === true) {
        showToastMessage(
          {
            message: response.message ?? '',
            type: 'success',
            toastAnimationFinished
          }
        )
        void fetchDonationPosts()
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setCancelPostError(errorMessage)
      donationData.status = previousStatus
    } finally {
      setIsLoading(false)
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
    myResponsesDetailHandler,
    cancelPost,
    cancelPostError,
    isLoading,
    showToast,
    handleRefresh: refreshPosts,
    refreshing,
    toastAnimationFinished
  }
}
