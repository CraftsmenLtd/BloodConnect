import { useState, useEffect } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { SCREENS } from '../../setup/constant/screens'
import { getDonationList } from '../donationService'
import { BloodDonationRecord } from '../types'
import { DonationPostsScreenNavigationProp } from '../../setup/navigation/navigationTypes'
import { useNavigation } from '@react-navigation/native'

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
    const fetchData = async(): Promise<void> => {
      setLoading(true)
      try {
        const response = await getDonationList({}, fetchClient)
        if (response.data !== undefined && response.data.length > 0) {
          const formattedDonations = formatDonations(response.data)
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

    const unsubscribe = navigation.addListener('focus', () => {
      setDonationPosts([])
      setErrorMessage('')
      setLoading(true)
      void fetchData()
    })

    return unsubscribe
  }, [navigation])

  const parseErrorMessage = (message: string): string | null => {
    try {
      const parsedError = JSON.parse(message)
      return parsedError !== null && typeof parsedError.message === 'string' ? parsedError.message : null
    } catch {
      return null
    }
  }

  const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const message = error.message
      const parsedMessage = parseErrorMessage(message)
      if (parsedMessage !== null) return parsedMessage
    }

    if (typeof error === 'string') {
      const parsedMessage = parseErrorMessage(error)
      if (parsedMessage !== null) return parsedMessage
    }

    return 'An unknown error occurred'
  }

  function formatDonations(requests: BloodDonationRecord[]): DonationData[] {
    return requests.map(request => ({
      requestPostId: request.reqPostId ?? '',
      patientName: request.patientName ?? '',
      requestedBloodGroup: request.requestedBloodGroup ?? '',
      bloodQuantity: formatBloodQuantity(request.bloodQuantity),
      urgencyLevel: request.urgencyLevel ?? '',
      location: request.location ?? '',
      donationDateTime: request.donationDateTime ?? new Date().toISOString(),
      contactNumber: request.contactNumber ?? '',
      transportationInfo: request.transportationInfo ?? '',
      shortDescription: request.shortDescription ?? '',
      // createdAt: request.createdAt ?? '',
      city: request.city ?? '',
      createdAt: request.createdAt ?? new Date().toISOString()
    }))
  }

  function formatBloodQuantity(bloodQuantity: string | null | undefined): string {
    if (bloodQuantity !== '' && bloodQuantity !== null && bloodQuantity !== undefined) {
      const quantity = +bloodQuantity
      return quantity === 1 ? `${quantity} Bag` : `${quantity} Bags`
    }
    return ''
  }

  const createPost = (): void => {
    navigation.navigate(SCREENS.DONATION, { data: null, isUpdating: false })
  }

  const updatePost = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
  }

  return {
    errorMessage,
    createPost,
    updatePost,
    donationPosts,
    loading
  }
}
