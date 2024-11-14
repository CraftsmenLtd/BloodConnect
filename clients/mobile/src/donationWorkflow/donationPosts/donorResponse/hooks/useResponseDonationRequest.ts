import { useState } from 'react'
import { useFetchClient } from '../../../../setup/clients/useFetchClient'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { SCREENS } from '../../../../setup/constant/screens'

type AcceptRequestParams = {
  requestPostId: string;
  seekerId: string;
  createdAt: string;
  acceptanceTime: string;
}

type useResponseDonationRequestReturnType = {
  isLoading: boolean;
  error: string | null;
  acceptRequest: (params: AcceptRequestParams) => Promise<void>;
}

export const useResponseDonationRequest = (): useResponseDonationRequestReturnType => {
  const navigation = useNavigation<NavigationProp<any>>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchClient = useFetchClient()

  const acceptRequest = async(params: AcceptRequestParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchClient.post('/donations/accept', {
        requestPostId: params.requestPostId,
        seekerId: params.seekerId,
        createdAt: params.createdAt,
        acceptanceTime: params.acceptanceTime
      })

      if (response.status !== 200) {
        throw new Error(`Error: ${response}`)
      } else {
        navigation.navigate(SCREENS.POSTS)
      }
    } catch (err: any) {
      console.error('Failed to accept request:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, acceptRequest }
}
