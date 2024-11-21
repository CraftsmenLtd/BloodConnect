import { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { SCREENS } from '../../setup/constant/screens'
import { DonationPostsScreenNavigationProp } from '../../setup/navigation/navigationTypes'
import { fetchData } from '../donationHelpers'
import { BloodDonationRecord } from '../types'
import { useFetchClient } from '../../setup/clients/useFetchClient'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

export const useDonationPosts = (): any => {
  const navigation = useNavigation<DonationPostsScreenNavigationProp>()
  const fetchClient = useFetchClient()
  const [donationPosts, setDonationPosts] = useState<DonationData[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setDonationPosts([])
      setErrorMessage('')
      setLoading(true)
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
  const viewDetailsHandler = (donationData): void => {
    navigation.navigate(SCREENS.DETAILPOST, { data: donationData })
  }

  return {
    errorMessage,
    createPost,
    updatePost,
    donationPosts,
    loading,
    viewDetailsHandler
  }
}
