// src/hooks/useMyActivity.ts

import { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { fetchData } from '../donationWorkflow/donationHelpers'
import { BloodDonationRecord } from '../donationWorkflow/types'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { SCREENS } from '../setup/constant/screens'
import { DonationPostsScreenNavigationProp } from '../setup/navigation/navigationTypes'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

export const useMyActivity = (): any => {
  const navigation = useNavigation<DonationPostsScreenNavigationProp>()
  const fetchClient = useFetchClient()
  const [donationPosts, setDonationPosts] = useState<DonationData[]>([])
  const [currentPage, setCurrentPage] = useState('My Posts')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => { void fetchData(fetchClient, setDonationPosts, setErrorMessage, setLoading) }, [])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void fetchData(fetchClient, setDonationPosts, setErrorMessage, setLoading)
    })
    return unsubscribe
  }, [navigation])

  const createPost = (): void => {
    navigation.navigate(SCREENS.DONATION, { data: null, isUpdating: false })
  }

  const updatePost = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
  }

  const detailHandler = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DETAILPOST, { data: donationData })
  }

  const handleTabPress = (tab: string): void => {
    setCurrentPage(tab)
  }

  return {
    errorMessage,
    currentPage,
    setCurrentPage,
    createPost,
    updatePost,
    donationPosts,
    loading,
    detailHandler,
    handleTabPress
  }
}
