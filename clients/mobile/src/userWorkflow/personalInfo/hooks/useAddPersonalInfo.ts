import { useMemo, useState, useEffect } from 'react'
import Constants from 'expo-constants'
import { useNavigation } from '@react-navigation/native'
import { validateRequired, ValidationRule, validateInput, validateDateOfBirth, validatePastOrTodayDate, validateHeight, validateWeight, validatePhoneNumber } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { AddPersonalInfoNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { addPersonalInfoHandler } from '../../services/userServices'
import { LocationService } from '../../../LocationService/LocationService'
import { formatErrorMessage, formatToTwoDecimalPlaces, formatPhoneNumber } from '../../../utility/formatting'
import { useUserProfile } from '../../../userWorkflow/context/UserProfileContext'
import { getCurrentUser } from 'aws-amplify/auth'

const { GOOGLE_MAP_API } = Constants.expoConfig?.extra ?? {}

type PersonalInfoKeys = keyof PersonalInfo

interface LocationData {
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface PersonalInfo {
  bloodGroup: string;
  height: string;
  weight: string;
  gender: string;
  lastDonationDate: Date;
  dateOfBirth: Date;
  lastVaccinatedDate: Date;
  city: string;
  locations: string[];
  availableForDonation: string;
  acceptPolicy: boolean;
  phoneNumber?: string; // Made optional since it's only required for SSO
}

// interface PersonalInfoErrors extends PersonalInfo {}
interface PersonalInfoErrors extends Omit<PersonalInfo, 'phoneNumber'> {
  phoneNumber?: string | null;
}

// const validationRules: Record<PersonalInfoKeys, ValidationRule[]> = {
//   availableForDonation: [validateRequired],
//   city: [validateRequired],
//   locations: [validateRequired],
//   bloodGroup: [validateRequired],
//   lastDonationDate: [validateRequired, validatePastOrTodayDate],
//   height: [validateRequired, validateHeight],
//   weight: [validateRequired, validateWeight],
//   gender: [validateRequired],
//   dateOfBirth: [validateRequired, validateDateOfBirth],
//   lastVaccinatedDate: [validateRequired, validatePastOrTodayDate],
//   acceptPolicy: [validateRequired],
//   phoneNumber: [validateRequired, validatePhoneNumber]
// }

export const useAddPersonalInfo = (): any => {
  const fetchClient = useFetchClient()
  const { fetchUserProfile } = useUserProfile()
  const navigation = useNavigation<AddPersonalInfoNavigationProp>()

  // const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
  //   bloodGroup: '',
  //   height: '',
  //   weight: '',
  //   gender: '',
  //   lastDonationDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
  //   dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
  //   lastVaccinatedDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
  //   city: '',
  //   locations: [],
  //   availableForDonation: 'yes',
  //   acceptPolicy: false,
  //   phoneNumber: ''
  // })

  const [isSSO, setIsSSO] = useState(false)

  // Check if user is from SSO
  useEffect(() => {
    const checkAuthProvider = async(): Promise<void> => {
      try {
        const user = await getCurrentUser()
        console.log('current--user', user)
        // If signInDetails includes 'hostedUI', it means the user signed in through SSO
        setIsSSO(((user?.username?.includes('Google')) ?? false) || ((user?.username?.includes('Facebook')) ?? false) || false)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        setIsSSO(false)
        throw new Error(`Error checking auth provider: ${errorMessage}`)
      }
    }

    void checkAuthProvider()
  }, [])

  // Create validation rules based on whether user is SSO or not
  const getValidationRules = (): Record<keyof PersonalInfo, ValidationRule[]> => {
    const rules: Partial<Record<keyof PersonalInfo, ValidationRule[]>> = {
      availableForDonation: [validateRequired],
      city: [validateRequired],
      locations: [validateRequired],
      bloodGroup: [validateRequired],
      lastDonationDate: [validateRequired, validatePastOrTodayDate],
      height: [validateRequired, validateHeight],
      weight: [validateRequired, validateWeight],
      gender: [validateRequired],
      dateOfBirth: [validateRequired, validateDateOfBirth],
      lastVaccinatedDate: [validateRequired, validatePastOrTodayDate],
      acceptPolicy: [validateRequired]
    }

    // Add phone number validation only for SSO users
    if (isSSO) {
      rules.phoneNumber = [validateRequired, validatePhoneNumber]
    }
    console.log('rules', rules.phoneNumber)

    return rules as Record<keyof PersonalInfo, ValidationRule[]>
  }

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    bloodGroup: '',
    height: '',
    weight: '',
    gender: '',
    lastDonationDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
    lastVaccinatedDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    city: '',
    locations: [],
    availableForDonation: 'yes',
    acceptPolicy: false,
    ...(isSSO ? { phoneNumber: '' } : {}) // Only include phone number for SSO users
  })

  // const [errors, setErrors] = useState<PersonalInfoErrors>(
  //   initializeState<PersonalInfo>(Object.keys(validationRules) as PersonalInfoKeys[], null)
  // )
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

  // const handleInputValidation = (name: PersonalInfoKeys, value: string | boolean): void => {
  //   const errorMsg = validateInput(value as string, validationRules[name])
  //   setErrors(prevErrors => ({
  //     ...prevErrors,
  //     [name]: errorMsg
  //   }))
  // }

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

  // const isButtonDisabled = useMemo(() => {
  //   return !(
  //     Object.values(personalInfo).every(value => value !== '' && !(Array.isArray(value) && value.length === 0)) &&
  //     Object.values(errors).every(error => error === null)
  //   ) || !personalInfo.acceptPolicy
  // }, [personalInfo, errors])
  const isButtonDisabled = useMemo(() => {
    const requiredFields = Object.keys(getValidationRules())
    return !(
      requiredFields.every(field => {
        const value = personalInfo[field as keyof PersonalInfo]
        return value !== '' && !(Array.isArray(value) && value.length === 0)
      }) &&
      Object.values(errors).every(error => error === null)
    ) || !personalInfo.acceptPolicy
  }, [personalInfo, errors, isSSO])

  async function formatLocations(locations: string[], city: string): Promise<LocationData[]> {
    const locationService = new LocationService(GOOGLE_MAP_API)

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
      const { locations, city, dateOfBirth, lastDonationDate, lastVaccinatedDate, phoneNumber, ...rest } = personalInfo
      const preferredDonationLocations = await formatLocations(locations, city)

      if (preferredDonationLocations.length === 0) {
        setErrorMessage('No valid locations were found. Please verify your input.')
        setLoading(false)
        return
      }

      const finalData = {
        ...rest,
        dateOfBirth: dateOfBirth.toISOString().substring(0, 10),
        lastDonationDate: lastDonationDate.toISOString().substring(0, 10),
        lastVaccinatedDate: lastVaccinatedDate.toISOString().substring(0, 10),
        height: formatToTwoDecimalPlaces(personalInfo.height),
        weight: formatToTwoDecimalPlaces(personalInfo.weight),
        preferredDonationLocations,
        // phoneNumbers: [formatPhoneNumber(phoneNumber)]
        ...(isSSO && (phoneNumber != null) ? { phoneNumbers: [formatPhoneNumber(phoneNumber)] } : {}) // Only include phone number for SSO users
      }

      const response = await addPersonalInfoHandler(finalData, fetchClient)
      if (response.status === 200) {
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
    errors,
    isVisible,
    setIsVisible,
    personalInfo,
    showDatePicker,
    setShowDatePicker,
    handleInputChange,
    isButtonDisabled,
    handleSubmit,
    isSSO // Export isSSO flag to use in UI
  }
}
