import { useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { validateRequired, ValidationRule, validateInput, validateDateOfBirth, validatePastOrTodayDate, validateHeight, validateWeight } from '../../../utility/validator'
import { initializeState } from '../../../utility/stateUtils'
import { AddPersonalInfoNavigationProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { addPersonalInfoHandler } from '../../services/userServices'
import { LocationService } from '../../../LocationService/LocationService'
import { formatToTwoDecimalPlaces } from '../../../utility/formatte'

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
}

interface PersonalInfoErrors extends PersonalInfo {}

const validationRules: Record<PersonalInfoKeys, ValidationRule[]> = {
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

export const useAddPersonalInfo = (): any => {
  const fetchClient = useFetchClient()
  const navigation = useNavigation<AddPersonalInfoNavigationProp>()
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    bloodGroup: '',
    height: '',
    weight: '',
    gender: '',
    lastDonationDate: new Date(),
    dateOfBirth: new Date(),
    lastVaccinatedDate: new Date(),
    city: '',
    locations: [],
    availableForDonation: 'yes',
    acceptPolicy: false
  }
  )
  const [errors, setErrors] = useState<PersonalInfoErrors>(
    initializeState<PersonalInfo>(Object.keys(validationRules) as PersonalInfoKeys[], null)
  )
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleInputChange = (name: PersonalInfoKeys, value: string): void => {
    setPersonalInfo(prevState => ({
      ...prevState,
      [name]: value
    }))
    setShowDatePicker(false)
    handleInputValidation(name, value)
  }

  const handleInputValidation = (name: PersonalInfoKeys, value: string | boolean): void => {
    const errorMsg = validateInput(value as string, validationRules[name])
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMsg
    }))
  }

  const isButtonDisabled = useMemo(() => {
    return !(
      Object.values(personalInfo).every(value => value !== '') &&
      Object.values(errors).every(error => error === null)
    ) || !personalInfo.acceptPolicy
  }, [personalInfo, errors])

  async function formatLocations(locations: string[], city: string): Promise<LocationData[]> {
    const locationService = new LocationService()

    const formattedLocations = await Promise.all(
      locations.map(async(area) => {
        const { lat, lon } = await locationService.getCoordinates(area)
        return {
          area,
          city,
          latitude: +lat,
          longitude: +lon
        }
      })
    )

    return formattedLocations
  }
  const handleSubmit = async(): Promise<void> => {
    try {
      setLoading(true)
      const { locations, city, dateOfBirth, lastDonationDate, lastVaccinatedDate, ...rest } = personalInfo
      const preferredDonationLocations = await formatLocations(locations, city)
      const finalData = {
        ...rest,
        dateOfBirth: dateOfBirth.toISOString().substring(0, 10),
        lastDonationDate: lastDonationDate.toISOString().substring(0, 10),
        lastVaccinatedDate: lastVaccinatedDate.toISOString().substring(0, 10),
        height: formatToTwoDecimalPlaces(personalInfo.height),
        weight: formatToTwoDecimalPlaces(personalInfo.weight),
        preferredDonationLocations
      }

      const response = await addPersonalInfoHandler(finalData, fetchClient)
      if (response.status === 200) {
        navigation.navigate(SCREENS.BOTTOM_TABS)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setErrorMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    errorMessage,
    errors,
    personalInfo,
    showDatePicker,
    setShowDatePicker,
    handleInputChange,
    isButtonDisabled,
    handleSubmit
  }
}
