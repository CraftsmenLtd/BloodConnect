import { useEffect, useState } from 'react'
import { useFetchClient } from '../../../../setup/clients/useFetchClient'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { SCREENS } from '../../../../setup/constant/screens'
import { useNotificationContext } from '../../../../setup/notification/useNotificationContext'
import { formatDateTime } from '../../../../utility/formatTimeAndDate'

type AcceptRequestParams = {
  requestPostId: string;
  seekerId: string;
  createdAt: string;
  acceptanceTime: string;
}

type useResponseDonationRequestReturnType = {
  bloodRequest: any;
  isLoading: boolean;
  error: string | null;
  handleAcceptRequest: () => Promise<void>;
  handleIgnore: () => void;
  formatDateTime: (dateTime: string) => string;
}

export const useResponseDonationRequest = (): useResponseDonationRequestReturnType => {
  const navigation = useNavigation<NavigationProp<any>>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchClient = useFetchClient()
  const { notificationData: bloodRequest } = useNotificationContext()

  // const bloodRequest = typeof notificationData === 'string'
  //   ? JSON.parse(notificationData)
  //   : notificationData

  useEffect(() => {
    if (bloodRequest === null) {
      navigation.navigate(SCREENS.POSTS)
    }
  }, [bloodRequest, navigation])

  const handleAcceptRequest = async () => {
    if (bloodRequest === null) return

    setIsLoading(true)
    setError(null)

    const requestPayload = {
      requestPostId: bloodRequest.requestPostId,
      seekerId: bloodRequest.seekerId,
      createdAt: bloodRequest.createdAt,
      acceptanceTime: new Date().toISOString()
    }
    console.log('request payload accept request: ', requestPayload)
    try {
      const response = await fetchClient.post('/donations/accept', requestPayload)

      if (response.status !== 200) {
        throw new Error(`Error: ${response}`)
      }

      navigation.navigate(SCREENS.POSTS)
    } catch (err: any) {
      console.error('Failed to accept request:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleIgnore = () => {
    navigation.navigate(SCREENS.POSTS)
  }

  return {
    bloodRequest,
    isLoading,
    error,
    handleAcceptRequest,
    handleIgnore,
    formatDateTime
  }
}
