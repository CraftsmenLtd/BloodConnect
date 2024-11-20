import { useMemo, useState, useEffect } from 'react'
import Constants from 'expo-constants'
import { validateInput, validateRequired, ValidationRule, validatePhoneNumber, validateDateTime, validateDonationDateTime } from '../../utility/validator'
import { initializeState } from '../../utility/stateUtils'
import { LocationService } from '../../LocationService/LocationService'
import { createDonation, DonationResponse, updateDonation } from '../donationService'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SCREENS } from '../../setup/constant/screens'
import { DonationScreenNavigationProp, DonationScreenRouteProp } from '../../setup/navigation/navigationTypes'
import { formatErrorMessage, formatPhoneNumber } from '../../utility/formatte'
import { useFetchClient } from '../../setup/clients/useFetchClient'

const { GOOGLE_MAP_API } = Constants.expoConfig?.extra ?? {}

export const DONATION_DATE_TIME_INPUT_NAME = 'donationDateTime'
type CredentialKeys = keyof BloodRequestData

export interface BloodRequestData {
  urgencyLevel: string;
  neededBloodGroup: string;
  bloodQuantity: string;
  donationDateTime: Date | string;
  location: string;
  contactNumber: string;
  patientName?: string;
  shortDescription?: string;
  transportationInfo?: string;
  city: string;
}

interface BloodRequestDataErrors extends Omit<BloodRequestData, 'patientName' | 'shortDescription' | 'transportationInfo'> {}

const validationRules: Record<keyof BloodRequestDataErrors, ValidationRule[]> = {
  city: [validateRequired],
  urgencyLevel: [validateRequired],
  neededBloodGroup: [validateRequired],
  bloodQuantity: [validateRequired],
  donationDateTime: [validateRequired, validateDateTime],
  location: [validateRequired],
  contactNumber: [validateRequired, validatePhoneNumber]
}

export const useBloodRequest = (): any => {
  const fetchClient = useFetchClient()
  const route = useRoute<DonationScreenRouteProp>()
  const navigation = useNavigation<DonationScreenNavigationProp>()
  const { data, isUpdating } = route.params
  const [bloodRequestData, setBloodRequestData] = useState<BloodRequestData>({
    urgencyLevel: 'regular',
    neededBloodGroup: '',
    bloodQuantity: '',
    donationDateTime: data !== null ? new Date(data.donationDateTime) : new Date(),
    location: '',
    contactNumber: '',
    patientName: '',
    shortDescription: '',
    transportationInfo: '',
    city: '',
    ...data
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<BloodRequestDataErrors>(initializeState<BloodRequestDataErrors>(
    Object.keys(validationRules) as Array<keyof BloodRequestDataErrors>, null)
  )

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isUpdating ? 'Update Blood Request' : 'Create Blood Request'
    })
  }, [isUpdating])

  const onDateChange = (selectedDate: string | Date): void => {
    const currentDate = typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate
    setBloodRequestData(prevState => ({
      ...prevState,
      donationDateTime: currentDate
    }))
    handleInputValidation(DONATION_DATE_TIME_INPUT_NAME, currentDate.toISOString())
  }
  const handleInputChange = (name: CredentialKeys, value: string): void => {
    if (name === DONATION_DATE_TIME_INPUT_NAME) {
      onDateChange(value)
      return
    }
    setBloodRequestData(prevState => ({
      ...prevState,
      [name]: value
    }))
    if (name in validationRules) {
      handleInputValidation(name as keyof BloodRequestDataErrors, value)
    }
  }

  const handleInputValidation = (name: keyof BloodRequestDataErrors, value: string): void => {
    const errorMsg = validateInput(value, validationRules[name])
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMsg
    }))
  }

  const isButtonDisabled = useMemo(() => {
    const hasErrors = !Object.values(errors).every(error => error === null)

    const requiredFieldsFilled = Object.keys(validationRules).every((key: string) => {
      const value = bloodRequestData[key as CredentialKeys]
      if (typeof value === 'string') {
        return value.trim() !== ''
      } else if (value instanceof Date) {
        return !isNaN(value.getTime())
      }
      return false
    })

    return hasErrors || !requiredFieldsFilled
  }, [errors, bloodRequestData])

  const removeEmptyAndNullProperty = (object: Record<string, unknown>): Record<string, unknown> => {
    return Object.fromEntries(Object.entries(object).filter(([_, v]) => v != null && v !== ''))
  }
  const createBloodDonationRequest = async(): Promise<DonationResponse> => {
    const { bloodQuantity, ...rest } = bloodRequestData
    const locationService = new LocationService(GOOGLE_MAP_API)
    const coordinates = await locationService.getLatLon(rest.location)
    const finalData = {
      ...removeEmptyAndNullProperty(rest),
      contactNumber: formatPhoneNumber(rest.contactNumber),
      bloodQuantity: +bloodQuantity.replace(/\b(\d+) (Bag|Bags)\b/, '$1'),
      donationDateTime: typeof rest.donationDateTime === 'string'
        ? new Date(rest.donationDateTime).toISOString()
        : rest.donationDateTime.toISOString(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    }
    return await createDonation(finalData, fetchClient)
  }

  const updateBloodDonationRequest = async(): Promise<DonationResponse> => {
    if ('acceptedDonors' in bloodRequestData) {
      delete bloodRequestData.acceptedDonors
    }
    const { bloodQuantity, city, location, neededBloodGroup, ...rest } = bloodRequestData
    const finalData = {
      ...removeEmptyAndNullProperty(rest),
      contactNumber: formatPhoneNumber(rest.contactNumber),
      bloodQuantity: +bloodQuantity.replace(/\b(\d+) (Bag|Bags)\b/, '$1'),
      donationDateTime: new Date(rest.donationDateTime).toISOString()
    }

    return await updateDonation(finalData, fetchClient)
  }

  const handlePostNow = async(): Promise<void> => {
    try {
      setLoading(true)
      const validateDonationDate = validateDonationDateTime(new Date(bloodRequestData.donationDateTime).toISOString())
      if (validateDonationDate !== null) {
        setErrorMessage(validateDonationDate)
        return
      }
      const response: DonationResponse = isUpdating
        ? await updateBloodDonationRequest()
        : await createBloodDonationRequest()

      if (response.status === 200) {
        navigation.navigate(SCREENS.POSTS)
      }
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
