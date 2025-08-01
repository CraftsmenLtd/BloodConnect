import { useMemo, useState, useEffect, useRef } from 'react'
import Constants from 'expo-constants'
import type {
  ValidationRule
} from '../../utility/validator'
import {
  validateInput,
  validateRequired,
  validateDateTime,
  validateDonationDateTime,
  validateShortDescription,
  validateDonationDateTimeWithin24Hours
} from '../../utility/validator'
import { initializeState } from '../../utility/stateUtils'
import { LocationService } from '../../LocationService/LocationService'
import type { DonationCreateUpdateResponse } from '../donationService'
import { createDonation, updateDonation } from '../donationService'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SCREENS } from '../../setup/constant/screens'
import type {
  DonationScreenNavigationProp,
  DonationScreenRouteProp
} from '../../setup/navigation/navigationTypes'
import { formatErrorMessage } from '../../utility/formatting'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { useMyActivityContext } from '../../myActivity/context/useMyActivityContext'
import { useUserProfile } from '../../userWorkflow/context/UserProfileContext'
import {
  cancelNotificationById,
  fetchScheduledNotifications,
  scheduleNotification
} from '../../setup/notification/scheduleNotification'
import type { NotificationRequest } from 'expo-notifications'
import { UrgencyLevel } from '../types'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

export const DONATION_DATE_TIME_INPUT_NAME = 'donationDateTime'
export const DONATION_URGENCY_LEVEL = 'urgencyLevel'
type CredentialKeys = keyof BloodRequestData

export type BloodRequestData = {
  urgencyLevel: string;
  requestedBloodGroup: string;
  bloodQuantity: string;
  donationDateTime: Date | string;
  location: string;
  contactNumber: string;
  patientName?: string;
  shortDescription?: string;
  transportationInfo?: string;
}

type BloodRequestDataErrors = {
  donationDateTime: string | null;
} & Omit<BloodRequestData, 'patientName' | 'transportationInfo' | 'donationDateTime'>

const validationRules: Record<keyof BloodRequestDataErrors, ValidationRule[]> = {
  urgencyLevel: [validateRequired],
  requestedBloodGroup: [validateRequired],
  bloodQuantity: [validateRequired],
  donationDateTime: [validateRequired, validateDateTime],
  location: [validateRequired],
  contactNumber: [validateRequired],
  shortDescription: [validateShortDescription]
}

export const useBloodRequest = (): unknown => {
  const fetchClient = useFetchClient()
  const route = useRoute<DonationScreenRouteProp>()
  const { fetchDonationPosts } = useMyActivityContext()
  const { userProfile } = useUserProfile()
  const navigation = useNavigation<DonationScreenNavigationProp>()
  const { data, isUpdating } = route.params
  const currentBloodRequestData = useRef(data)
  const [bloodRequestData, setBloodRequestData] = useState<BloodRequestData>({
    urgencyLevel: 'regular',
    requestedBloodGroup: '',
    bloodQuantity: '',
    donationDateTime: data !== null ? new Date(data.donationDateTime) : new Date(),
    location: '',
    contactNumber: '',
    patientName: userProfile.name ?? '',
    shortDescription: '',
    transportationInfo: '',
    ...data
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<BloodRequestDataErrors>(
    initializeState<BloodRequestDataErrors>(
    Object.keys(validationRules) as Array<keyof BloodRequestDataErrors>, null)
  )

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isUpdating ? 'Update Blood Request' : 'Create Blood Request'
    })
  }, [isUpdating])

  const onDateChange = (selectedDate: string | Date): void => {
    const currentDate = typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate
    setBloodRequestData((prevState) => ({
      ...prevState,
      donationDateTime: currentDate
    }))
    handleInputValidation(DONATION_DATE_TIME_INPUT_NAME, currentDate.toISOString())
  }
  const handleInputChange = (name: CredentialKeys, value: string): void => {
    const updateErrors = (error: string | null): void => {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [DONATION_DATE_TIME_INPUT_NAME]: error ?? null
      }))
    }

    if (name === DONATION_DATE_TIME_INPUT_NAME) {
      onDateChange(value)
      if (bloodRequestData.urgencyLevel === UrgencyLevel.URGENT) {
        updateErrors(validateDonationDateTimeWithin24Hours(value))
      }

      return
    }

    if (name === DONATION_URGENCY_LEVEL) {
      if (value === UrgencyLevel.REGULAR) {
        if (bloodRequestData.donationDateTime !== null) {
          updateErrors(null)
        }
      } else {
        updateErrors(
          validateDonationDateTimeWithin24Hours(
            bloodRequestData.donationDateTime.toString()
          )
        )
      }
    }

    setBloodRequestData((prevState) => ({
      ...prevState,
      [name]: value
    }))

    if (name in validationRules) {
      handleInputValidation(name as keyof BloodRequestDataErrors, value)
    }
  }

  const handleInputValidation = (name: keyof BloodRequestDataErrors, value: string): void => {
    const errorMsg = validateInput(value, validationRules[name])
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: errorMsg
    }))
  }

  const adjustNotificationTime = (notificationDate: string | Date): Date => {
    const adjustedDate = new Date(notificationDate)
    adjustedDate.setDate(adjustedDate.getDate() + 1)

    const hours = adjustedDate.getHours()
    if (hours >= 22) {
      adjustedDate.setHours(22, 0, 0, 0)
    } else if (hours < 9) {
      adjustedDate.setHours(9, 0, 0, 0)
    }

    return adjustedDate
  }

  const isButtonDisabled = useMemo(() => {
    const hasErrors = !Object.values(errors).every((error) => error === null)
    const requiredFieldsFilled = Object.keys(validationRules).every((key: string) => {
      const value = bloodRequestData[key as CredentialKeys]
      const isRequired = validationRules[
        key as keyof BloodRequestDataErrors
      ].includes(validateRequired)
      if (!isRequired) return true
      if (typeof value === 'string') {
        return value.trim() !== ''
      } else if (value instanceof Date) {
        return !isNaN(value.getTime())
      }

      return false
    })

    return hasErrors || !requiredFieldsFilled
  }, [errors, bloodRequestData])

  const removeEmptyAndNullProperty = (object: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(
    Object.entries(object).filter(([_, v]) => v !== null && v !== '')
  )

  const createBloodDonationRequest = async(): Promise<DonationCreateUpdateResponse> => {
    const { bloodQuantity, ...rest } = bloodRequestData
    const locationService = new LocationService(API_BASE_URL)
    const coordinates = await locationService.getLatLon(rest.location)
    const finalData = {
      ...removeEmptyAndNullProperty(rest),
      contactNumber: rest.contactNumber,
      bloodQuantity: Number(bloodQuantity),
      donationDateTime: typeof rest.donationDateTime === 'string'
        ? new Date(rest.donationDateTime).toISOString()
        : rest.donationDateTime.toISOString(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      shortDescription: rest.shortDescription.replaceAll(/\n/g, ' ')
    }

    return createDonation(finalData, fetchClient)
  }

  const updateBloodDonationRequest = async(): Promise<DonationCreateUpdateResponse> => {
    if (!('requestPostId' in bloodRequestData) || !('createdAt' in bloodRequestData)) {
      throw new Error('Invalid bloodRequestData: Missing requestPostId or createdAt')
    }

    const { bloodQuantity } = bloodRequestData
    const finalData = {
      urgencyLevel: bloodRequestData.urgencyLevel,
      donationDateTime: new Date(bloodRequestData.donationDateTime).toISOString(),
      contactNumber: bloodRequestData.contactNumber,
      patientName: bloodRequestData.patientName,
      shortDescription: bloodRequestData.shortDescription.replaceAll(/\n/g, ' '),
      transportationInfo: bloodRequestData.transportationInfo,
      requestPostId: bloodRequestData?.requestPostId,
      createdAt: bloodRequestData?.createdAt,
      bloodQuantity: Number(bloodQuantity)
    }

    return updateDonation(finalData, fetchClient)
  }

  const findNotificationByRequestPostId = (
    notifications: NotificationRequest[],
    requestPostId: string): NotificationRequest | undefined =>
    notifications.find(
      (notification) => notification.content?.data?.payload?.requestPostId === requestPostId
    )

  const updateNotificationTriggerTime = async(
    donationDateTime: string | Date,
    requestPostId: string
  ): Promise<void> => {
    const notifications = await fetchScheduledNotifications()
    const notificationToUpdate = findNotificationByRequestPostId(notifications, requestPostId)
    if (notificationToUpdate === null) return
    await cancelNotificationById(notificationToUpdate.identifier)
    const adjustedTime = adjustNotificationTime(donationDateTime)
    void scheduleNotification({ date: adjustedTime }, notificationToUpdate.content?.data?.payload)
  }

  const handleNotification = (
    donationDateTime: string | Date,
    donationResponse: {
      requestPostId: string;
      createdAt: string;
    }): void => {
    if (
      isUpdating
      && currentBloodRequestData.current?.donationDateTime === bloodRequestData.donationDateTime
    ) return
    if (isUpdating) {
      void updateNotificationTriggerTime(donationDateTime, donationResponse.requestPostId)
    }
  }

  const handlePostNow = async(): Promise<void> => {
    try {
      setLoading(true)
      const validateDonationDate = validateDonationDateTime(
        new Date(bloodRequestData.donationDateTime).toISOString()
      )
      if (validateDonationDate !== null) {
        setErrorMessage(validateDonationDate)

        return
      }

      if (bloodRequestData.urgencyLevel === UrgencyLevel.URGENT) {
        const validationError = validateDonationDateTimeWithin24Hours(
          bloodRequestData.donationDateTime.toString()
        )
        if (validationError !== null) {
          setErrorMessage(validationError)

          return
        }
      }

      const response = isUpdating
        ? await updateBloodDonationRequest()
        : await createBloodDonationRequest()
      if (response.status !== 201 && response.status !== 200) return

      if (response.data !== undefined) {
        handleNotification(bloodRequestData.donationDateTime, response.data)
      }
      void fetchDonationPosts()
      navigation.navigate(SCREENS.MY_ACTIVITY)
    } catch (error) {
      const errorMessage = formatErrorMessage(error)
      setErrorMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    isUpdating,
    errors,
    setErrors,
    showDatePicker,
    setShowDatePicker,
    isButtonDisabled,
    bloodRequestData,
    handleInputChange,
    handlePostNow,
    loading,
    errorMessage
  }
}
