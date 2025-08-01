import { useEffect, useState } from 'react'
import { useFetchClient } from '../../../../setup/clients/useFetchClient'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SCREENS } from '../../../../setup/constant/screens'
import { formatDateTime } from '../../../../utility/formatTimeAndDate'
import type {
  PostScreenNavigationProp,
  RequestPreviewRouteProp
} from '../../../../setup/navigation/navigationTypes'
import { STATUS } from '../../../types'
import { handleNotification } from '../../../../setup/notification/scheduleNotification'
import { extractErrorMessage } from '../../../donationHelpers'
import { useMyActivityContext } from '../../../../myActivity/context/useMyActivityContext'
import { updateMyResponses } from '../../../donationService'
import { useUserProfile } from '../../../../userWorkflow/context/UserProfileContext'
import { ToastAndroid } from 'react-native'
import useFetchData from '../../../../setup/clients/useFetchData'
import type { UserProfile } from '../../../../userWorkflow/services/userProfileService'

type AcceptRequestParams = {
  requestPostId: string;
  seekerId: string;
  createdAt: string;
  status: string;
}

type useResponseDonationRequestReturnType = {
  bloodRequest: unknown;
  userProfile: UserProfile;
  isLoading: boolean;
  error: string | null;
  handleAcceptRequest: () => Promise<void>;
  handleIgnore: () => Promise<void>;
  formatDateTime: (dateTime: string) => string;
  isRequestAccepted: boolean;
}

type FetchResponse = {
  status: number;
  statusText?: string;
}

export const useResponseDonationRequest = (): useResponseDonationRequestReturnType => {
  const { userProfile } = useUserProfile()
  const navigation = useNavigation<PostScreenNavigationProp>()
  const { getMyResponses } = useMyActivityContext()
  const { notificationData: bloodRequest } = useRoute<RequestPreviewRouteProp>().params

  const [isRequestAccepted, setIsRequestAccepted] = useState(false)
  const fetchClient = useFetchClient()

  useEffect(() => {
    if (bloodRequest === null) {
      navigation.navigate(SCREENS.POSTS)
    }
  }, [bloodRequest, navigation])

  const [handleAcceptRequest, isAcceptLoading, , acceptError] = useFetchData(async(): Promise<void> => {
    if (bloodRequest === null) {
      throw new Error('Missing some required data. Please try again')
    }

    if (userProfile.bloodGroup !== bloodRequest.requestedBloodGroup) {
      ToastAndroid.showWithGravity('Blood group doesn\'t match', ToastAndroid.SHORT, ToastAndroid.CENTER)

      return
    }
    const isString = (value: unknown): value is string => typeof value === 'string'
    const requestPayload: AcceptRequestParams = {
      requestPostId: isString(bloodRequest.requestPostId) ? bloodRequest.requestPostId : '',
      seekerId: isString(bloodRequest.seekerId) ? bloodRequest.seekerId : '',
      createdAt: isString(bloodRequest.createdAt) ? bloodRequest.createdAt : '',
      status: STATUS.ACCEPTED
    }
    try {
      const response: FetchResponse = await fetchClient.patch('/donations/responses', requestPayload)
      if (response.status !== 200) {
        const errorMessage = `Error: ${response.status} ${response.statusText ?? 'Unknown error'}`
        throw new Error(errorMessage)
      }

      if (bloodRequest === null
        || !(bloodRequest.donationDateTime instanceof Date
          || typeof bloodRequest.donationDateTime === 'string'
          || typeof bloodRequest.donationDateTime === 'number')) {
        return
      }

      handleNotification(new Date(bloodRequest.donationDateTime))
      await getMyResponses()
      setIsRequestAccepted(true)
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      throw new Error(errorMessage)
    }
  })

  const [handleIgnore, isIgnoreLoading, , ignoreError] = useFetchData(async() => {
    if (
      bloodRequest === null
      || ['requestPostId', 'seekerId', 'createdAt', 'requestedBloodGroup'].some(
        (key) => bloodRequest[key] === undefined
      )
    ) {
      throw new Error('Request incomplete.Appropriate data not found.')
    }

    if (userProfile.bloodGroup !== bloodRequest.requestedBloodGroup) {
      navigation.navigate(SCREENS.POSTS)

      return
    }
    const { requestPostId, seekerId, createdAt } = bloodRequest

    const requestPayload = {
      requestPostId,
      seekerId,
      createdAt,
      status: STATUS.IGNORED
    }
    const response = await updateMyResponses(requestPayload, fetchClient)
    if (response.status === 200) {
      navigation.navigate(SCREENS.POSTS)
    } else {
      throw new Error('Could not complete ignore response')
    }
  })

  return {
    isRequestAccepted,
    isLoading: isAcceptLoading || isIgnoreLoading,
    bloodRequest,
    userProfile,
    error: acceptError ?? ignoreError,
    handleAcceptRequest,
    handleIgnore,
    formatDateTime
  }
}
