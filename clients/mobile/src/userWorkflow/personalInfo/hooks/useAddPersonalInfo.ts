import { useMemo, useState, useEffect } from 'react'
import Constants from 'expo-constants'
import { useNavigation } from '@react-navigation/native'
import type {
  ValidationRule} from '../../../utility/validator';
import {
  validateRequired,
  validateInput,
  validateDateOfBirth,
  validatePastOrTodayDate,
  validateHeight,
  validateWeight,
  validatePhoneNumber
} from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import type { AddPersonalInfoNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { createUserProfile } from '../../services/userProfileService'
import type {
  LocationData} from '../../../utility/formatting';
import {
  formatErrorMessage,
  formatToTwoDecimalPlaces,
  formatPhoneNumber
} from '../../../utility/formatting'
import { useUserProfile } from '../../context/UserProfileContext'
import { getCurrentUser } from 'aws-amplify/auth'
import { LocationService } from '../../../LocationService/LocationService';

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

type PersonalInfoKeys = keyof PersonalInfo

export type PersonalInfo = {
  bloodGroup: string;
  height: string;
  weight: string;
  gender: string;
  lastDonationDate: null | Date;
  dateOfBirth: Date;
  lastVaccinatedDate: null | Date;
  locations: string[];
  availableForDonation: string;
  acceptPolicy: boolean;
  phoneNumber?: string;
}

type PersonalInfoErrors = {
  phoneNumber?: string | null;
} & Omit<PersonalInfo, 'phoneNumber'>

export const useAddPersonalInfo = (): unknown => {
  const fetchClient = useFetchClient()
  const { fetchUserProfile } = useUserProfile()
  const navigation = useNavigation<AddPersonalInfoNavigationProp>()
  const [isSSO, setIsSSO] = useState(false)

  useEffect(() => {
    const checkAuthProvider = async(): Promise<void> => {
      try {
        const user = await getCurrentUser()
        setIsSSO(((user?.username?.includes('Google')) ?? false) || ((user?.username?.includes('Facebook')) ?? false) || false)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        setIsSSO(false)
        throw new Error(`Error checking auth provider: ${errorMessage}`)
      }
    }

    void checkAuthProvider()
  }, [])

  const getValidationRules = (): Record<PersonalInfoKeys, ValidationRule[]> => {
    const rules: Partial<Record<PersonalInfoKeys, ValidationRule[]>> = {
      availableForDonation: [validateRequired],
      locations: [validateRequired],
      bloodGroup: [validateRequired],
      lastDonationDate: [validatePastOrTodayDate],
      height: [validateRequired, validateHeight],
      weight: [validateRequired, validateWeight],
      gender: [validateRequired],
      dateOfBirth: [validateRequired, validateDateOfBirth],
      lastVaccinatedDate: [validatePastOrTodayDate],
      acceptPolicy: [validateRequired]
    }
    if (isSSO) {
      rules.phoneNumber = [validateRequired, validatePhoneNumber]
    }

    return rules as Record<PersonalInfoKeys, ValidationRule[]>
  }

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    bloodGroup: '',
    height: '',
    weight: '',
    gender: '',
    lastDonationDate: null,
    dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
    lastVaccinatedDate: null,
    locations: [],
    availableForDonation: 'yes',
    acceptPolicy: false,
    ...(isSSO ? { phoneNumber: '' } : {})
  })

  const [errors, setErrors] = useState<PersonalInfoErrors>(
    initializeState<PersonalInfo>(Object.keys(getValidationRules()) as PersonalInfoKeys[], null)
  )
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isVisible, setIsVisible] = useState('')

  const handleInputChange = (name: PersonalInfoKeys, value: string): void => {
    setPersonalInfo(prevState => ({
      ...prevState,
      [name]: value
    }))
    setShowDatePicker(false)
    handleInputValidation(name, value)
  }

  const handleInputValidation = (name: PersonalInfoKeys, value: string | boolean): void => {
    const validationRules = getValidationRules()
    if (name in validationRules && Array.isArray(validationRules[name])) {
      const errorMsg = validateInput(value as string, validationRules[name])
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: errorMsg
      }))
    }
  }

  const isButtonDisabled = useMemo(() => {
    const requiredFields = Object.keys(getValidationRules()) as PersonalInfoKeys[]
    return !(
      requiredFields.every(field => {
        const value = personalInfo[field]
        return value !== '' && !(Array.isArray(value) && value.length === 0)
      }) &&
      Object.values(errors).every(error => error === null)
    ) || !personalInfo.acceptPolicy
  }, [personalInfo, errors, isSSO])

  async function formatLocations(locations: string[], city: string): Promise<LocationData[]> {
    const locationService = new LocationService(API_BASE_URL)

    const formattedLocations = await Promise.all(
      locations.map(async(area) =>
        locationService.getLatLon(area)
          .then((location) => {
            if (location !== null) {
              const { latitude, longitude } = location
              return { area, city, latitude, longitude }
            }
          })
          .catch(() => { return null })
      )
    )
    return formattedLocations.filter((location): location is LocationData => location !== null)
  }

  const handleSubmit = async(): Promise<void> => {
    try {
      setLoading(true)
      const { locations, dateOfBirth, lastDonationDate, lastVaccinatedDate, phoneNumber, ...rest } = personalInfo
      const preferredDonationLocations = await formatLocations(locations, API_BASE_URL)

      if (preferredDonationLocations.length === 0) {
        setErrorMessage('No valid locations were found. Please verify your input.')
        setLoading(false)
        return
      }

      const finalData = {
        ...rest,
        dateOfBirth: dateOfBirth.toISOString().substring(0, 10),
        ...(lastDonationDate !== null && { lastDonationDate: lastDonationDate.toISOString().substring(0, 10) }),
        ...(lastVaccinatedDate !== null && { lastVaccinatedDate: lastVaccinatedDate.toISOString().substring(0, 10) }),
        height: personalInfo.height,
        weight: formatToTwoDecimalPlaces(personalInfo.weight),
        preferredDonationLocations,
        ...(isSSO && phoneNumber != null ? { phoneNumbers: [formatPhoneNumber(phoneNumber)] } : {}),
        availableForDonation: rest.availableForDonation === 'yes'
      }

      const response = await createUserProfile(finalData, fetchClient)
      if (response.status === 201) {
        await fetchUserProfile()
        navigation.navigate(SCREENS.BOTTOM_TABS)
      }
    } catch (error) {
      const errorMessage = formatErrorMessage(error)
      setErrorMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    errorMessage,
    setErrorMessage,
    errors,
    isVisible,
    setIsVisible,
    personalInfo,
    showDatePicker,
    setShowDatePicker,
    handleInputChange,
    isButtonDisabled,
    handleSubmit,
    isSSO
  }
}
