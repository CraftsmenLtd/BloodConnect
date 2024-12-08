import { useEffect, useState } from 'react'
import { useFetchClient } from '../../../../setup/clients/useFetchClient'
import { useNavigation } from '@react-navigation/native'
import { SCREENS } from '../../../../setup/constant/screens'
import { useNotificationContext } from '../../../../setup/notification/useNotificationContext'
import { formatDateTime } from '../../../../utility/formatTimeAndDate'
import { PostScreenNavigationProp } from '../../../../setup/navigation/navigationTypes'

interface AcceptRequestParams {
  requestPostId: string;
  seekerId: string;
  createdAt: string;
  acceptanceTime: string;
}

interface useResponseDonationRequestReturnType {
  bloodRequest: any;
  isLoading: boolean;
  error: string | null;
  handleAcceptRequest: () => Promise<void>;
  handleIgnore: () => void;
  formatDateTime: (dateTime: string) => string;
  isRequestAccepted: boolean;
}

interface FetchResponse {
  status: number;
  statusText?: string;
}

export const useResponseDonationRequest = (): useResponseDonationRequestReturnType => {
  const navigation = useNavigation<PostScreenNavigationProp>()
  const [isRequestAccepted, setIsRequestAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchClient = useFetchClient()
  const { notificationData: bloodRequest } = useNotificationContext()

  useEffect(() => {
    if (bloodRequest === null) {
      navigation.navigate(SCREENS.POSTS)
    }
  }, [bloodRequest, navigation])

  const handleAcceptRequest = async(): Promise<void> => {
    if (bloodRequest === null) return

    setIsLoading(true)
    setError(null)
    const isString = (value: unknown): value is string => typeof value === 'string'
    const requestPayload: AcceptRequestParams = {
      requestPostId: isString(bloodRequest.requestPostId) ? bloodRequest.requestPostId : '',
      seekerId: isString(bloodRequest.seekerId) ? bloodRequest.seekerId : '',
      createdAt: isString(bloodRequest.createdAt) ? bloodRequest.createdAt : '',
      acceptanceTime: new Date().toISOString()
    }
    try {
      const response: FetchResponse = await fetchClient.post('/donations/accept', requestPayload)

      if (response.status === 200) {
        setIsRequestAccepted(true)
      } else {
        const errorMessage = `Error: ${response.status} ${response.statusText ?? 'Unknown error'}`
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error && typeof error.message === 'string'
        ? error.message
        : 'An unexpected error occurred while accepting the request'
      setError(errorMessage)
      throw new Error(`Failed to accept request: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIgnore = (): void => {
    navigation.navigate(SCREENS.POSTS)
  }

  return {
    isRequestAccepted,
    isLoading,
    bloodRequest,
    error,
    handleAcceptRequest,
    handleIgnore,
    formatDateTime
  }
}
