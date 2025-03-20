import { useEffect, useState } from 'react'
import { useFetchClient } from '../../../../setup/clients/useFetchClient'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SCREENS } from '../../../../setup/constant/screens'
import { formatDateTime } from '../../../../utility/formatTimeAndDate'
import { PostScreenNavigationProp, RequestPreviewRouteProp } from '../../../../setup/navigation/navigationTypes'
import { STATUS } from '../../../types'
import { scheduleNotification } from '../../../../setup/notification/scheduleNotification'
import {
  LOCAL_NOTIFICATION_TYPE,
  REMINDER_NOTIFICATION_BODY,
  REMINDER_NOTIFICATION_TITLE,
  REMINDING_HOURS_BEFORE_DONATION
} from '../../../../setup/constant/consts'
import { replaceTemplatePlaceholders } from '../../../../utility/formatting'
import { extractErrorMessage } from '../../../donationHelpers'
import { useMyActivityContext } from '../../../../myActivity/context/useMyActivityContext'
import { updateMyResponses } from '../../../donationService'
import { useUserProfile } from '../../../../userWorkflow/context/UserProfileContext'
import { ToastAndroid } from 'react-native'
import useFetchData from '../../../../setup/clients/useFetchData'
import { UserProfile } from '../../../../userWorkflow/services/userProfileService'

interface AcceptRequestParams {
  requestPostId: string;
  seekerId: string;
  createdAt: string;
  status: string;
}

interface useResponseDonationRequestReturnType {
  bloodRequest: any;
  userProfile: UserProfile;
  isLoading: boolean;
  error: string | null;
  handleAcceptRequest: () => Promise<void>;
  handleIgnore: () => Promise<void>;
  formatDateTime: (dateTime: string) => string;
  isRequestAccepted: boolean;
}

interface FetchResponse {
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

  const handleNotification = (donationDateTime: string | Date): void => {
    const donationTime = new Date(donationDateTime)

    REMINDING_HOURS_BEFORE_DONATION.forEach((hoursBefore) => {
      const reminderTime = new Date(donationTime.getTime() - hoursBefore * 60 * 60 * 1000)
      const content = {
        title: hoursBefore === 1
          ? REMINDER_NOTIFICATION_TITLE.FINAL
          : replaceTemplatePlaceholders(REMINDER_NOTIFICATION_TITLE.DEFAULT, hoursBefore.toString()),
        body: hoursBefore === 1
          ? REMINDER_NOTIFICATION_BODY.FINAL
          : replaceTemplatePlaceholders(REMINDER_NOTIFICATION_BODY.DEFAULT, hoursBefore.toString()),
        data: { payload: { }, type: LOCAL_NOTIFICATION_TYPE.REMINDER }
      }
      void scheduleNotification({ date: reminderTime }, content)
    })
  }

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

      if (bloodRequest === null ||
        !(bloodRequest.donationDateTime instanceof Date ||
        typeof bloodRequest.donationDateTime === 'string' ||
        typeof bloodRequest.donationDateTime === 'number')) {
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
      bloodRequest === null ||
      ['requestPostId', 'seekerId', 'createdAt', 'requestedBloodGroup'].some(
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
