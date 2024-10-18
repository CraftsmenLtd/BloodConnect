import { useMemo, useState } from 'react'
import { validateInput, validateRequired, ValidationRule, validatePhoneNumber, validateDateTime, validateDonationDateTime } from '../utility/validator'
import { initializeState } from '../utility/stateUtils'
import { LocationService } from '../LocationService/LocationService'
import fetchClient from '../setup/clients/apiClient'
import { createDonation } from './donationService'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SCREENS } from '../setup/constant/screens'
import { DonationScreenNavigationProp, DonationScreenRouteProp } from '../setup/navigation/navigationTypes'
import { formatPhoneNumber } from '../utility/formatte'

type CredentialKeys = keyof BloodRequestData

export interface BloodRequestData {
  urgencyLevel: string;
  neededBloodGroup: string;
  bloodQuantity: string;
  donationDateTime: Date;
  location: string;
  contactNumber: string;
  patientName: string;
  shortDescription: string;
  transportationInfo: string;
}

interface BloodRequestDataErrors extends Omit<BloodRequestData, 'patientName' | 'shortDescription' | 'transportationInfo'> {}

const validationRules: Record<keyof BloodRequestDataErrors, ValidationRule[]> = {
  urgencyLevel: [validateRequired],
  neededBloodGroup: [validateRequired],
  bloodQuantity: [validateRequired],
  donationDateTime: [validateRequired, validateDateTime],
  location: [validateRequired],
  contactNumber: [validateRequired, validatePhoneNumber]
}

export const useBloodRequest = (): any => {
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
    ...data
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<BloodRequestDataErrors>(initializeState<BloodRequestDataErrors>(
    Object.keys(validationRules) as Array<keyof BloodRequestDataErrors>, null)
  )

  const onDateChange = (selectedDate: string | Date): void => {
    const currentDate = typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate
    setBloodRequestData(prevState => ({
      ...prevState,
      donationDateTime: currentDate
    }))
    handleInputValidation('donationDateTime', currentDate.toISOString())
  }
  const handleInputChange = (name: CredentialKeys, value: string): void => {
    if (name === 'donationDateTime') {
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

  const handlePostNow = async(): Promise<void> => {
    try {
      const validateDonationDate = validateDonationDateTime(bloodRequestData.donationDateTime.toISOString())
      if (validateDonationDate !== null) {
        setErrorMessage(validateDonationDate)
        return
      }
      setLoading(true)
      const { bloodQuantity, ...rest } = bloodRequestData
      const cleanedRest = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v != null && v !== ''))
      const locationService = new LocationService(fetchClient)
      const coordinates = await locationService.getCoordinates(rest.location)
      const finalData = {
        seekerId: '51732daa-40d1-70d4-a589-35cafe9184e6',
        ...cleanedRest,
        contactNumber: formatPhoneNumber(rest.contactNumber),
        bloodQuantity: +bloodQuantity.replace(/\b(\d+) (Bag|Bags)\b/, '$1'),
        donationDateTime: rest.donationDateTime.toISOString(),
        latitude: +coordinates.lat,
        longitude: +coordinates.lon
      }

      const response = await createDonation(finalData, fetchClient)
      if (response.status === 200) {
        navigation.navigate(SCREENS.PROFILE)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
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
