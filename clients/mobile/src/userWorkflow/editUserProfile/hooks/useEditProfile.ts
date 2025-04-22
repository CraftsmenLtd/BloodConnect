import { useMemo, useState } from 'react'
import type {
  ValidationRule
} from '../../../utility/validator'
import {
  validateDateOfBirth,
  validateHeight,
  validateInput,
  validatePastOrTodayDate,
  validateRequired,
  validateWeight
} from '../../../utility/validator'
import { useRoute } from '@react-navigation/native'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { initializeState } from '../../../utility/stateUtils'
import { Alert } from 'react-native'
import { useUserProfile } from '../../context/UserProfileContext'
import useFetchData from '../../../setup/clients/useFetchData'
import { updateUserProfile } from '../../services/userProfileService'
import type { EditProfileRouteProp } from '../../../setup/navigation/navigationTypes'
import type { EditProfileData } from '../../userProfile/UI/Profile'
import Constants from 'expo-constants'
import { formatLocations } from '../../../utility/formatting'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

type ProfileFields = keyof Omit<ProfileData, 'location'>

type ProfileData = {
  [K in keyof EditProfileData as K extends string ? (string extends K ? never : K) : never]: EditProfileData[K];
} & {
  weight: string | undefined;
}

type ProfileDataErrors = {
  [key in ProfileFields]?: string | null;
}

const validationRules: Record<keyof Omit<ProfileData, 'location'>, ValidationRule[]> = {
  name: [validateRequired],
  dateOfBirth: [validateDateOfBirth, validateRequired],
  weight: [validateRequired, validateWeight],
  height: [validateRequired, validateHeight],
  gender: [validateRequired],
  phone: [validateRequired],
  preferredDonationLocations: [validateRequired],
  lastDonationDate: [validatePastOrTodayDate],
  locations: []
}

export const useEditProfile = (): unknown => {
  const { fetchUserProfile } = useUserProfile()
  const route = useRoute<EditProfileRouteProp>()
  const fetchClient = useFetchClient()
  const { userDetails } = route.params

  const [profileData, setProfileData] = useState(() => {
    if (!Array.isArray(userDetails.phoneNumbers) || userDetails.phoneNumbers.length === 0) {
      throw new Error('userDetails.phoneNumbers must contain at least one value')
    }

    return {
      ...userDetails,
      phone: userDetails.phoneNumbers[0]
    }
  })
  const [errors, setErrors] = useState<ProfileDataErrors>(
    initializeState<ProfileDataErrors>(Object.keys(validationRules) as ProfileFields[], null)
  )

  const [executeUpdateProfile, loading, , updateError] = useFetchData(
    async(payload: Partial<ProfileData>) => {
      const response = await updateUserProfile(payload, fetchClient)

      if (response.status !== 200) {
        throw new Error('Failed to update profile')
      }
      await fetchUserProfile()
    },
    {
      parseError: (error) => (error instanceof Error ? error.message : 'Unknown error')
    }
  )

  const handleInputChange = (field: ProfileFields, value: string): void => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value
    }))

    handleInputValidation(field, value)
  }

  const handleInputValidation = (field: ProfileFields, value: string): void => {
    setErrors((prevErrors) => {
      const errorMsg = validateInput(value, validationRules[field])
      if (prevErrors[field] === errorMsg) return prevErrors
      return { ...prevErrors, [field]: errorMsg }
    })
  }

  const handleSave = async(): Promise<void> => {
    const newErrors: Record<string, string | null> = {}
    const validationFields = Object.keys(validationRules) as ProfileFields[]
    validationFields.forEach(field => {
      const value = profileData[field]
      const rules = validationRules[field]
      newErrors[field] = validateInput(value, rules)
    })

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      Alert.alert('Please fix the highlighted errors.')
      return
    }

    const { phone, ...rest } = profileData
    userDetails.phoneNumbers[0] = phone
    const filteredLocations = rest.locations.filter(
      (location) => !rest.preferredDonationLocations.some((preferred) => preferred.area === location)
    )
    const updatedPreferredDonationLocations = rest.preferredDonationLocations.filter(
      (preferred) => rest.locations.includes(preferred.area)
    )

    try {
      const requestPayload = {
        ...rest,
        weight: parseFloat(profileData.weight),
        preferredDonationLocations: [
          ...updatedPreferredDonationLocations,
          ...await formatLocations(filteredLocations, API_BASE_URL)
        ]
      }

      await executeUpdateProfile(requestPayload)
      if (updateError !== null) {
        throw new Error('Failed to update profile')
      } else {
        await fetchUserProfile()
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update profile.')
    }
  }

  const hasErrors = useMemo(
    () => Object.values(errors).some((error) => error),
    [errors]
  )
  const requiredFields = Object.keys(validationRules).filter(key => !['lastDonationDate'].includes(key))

  const areRequiredFieldsFilled = useMemo(
    () =>
      requiredFields.every((key) => {
        const value = profileData[key as keyof ProfileData]
        return value !== null && value !== undefined && value.toString().trim() !== ''
      }),
    [profileData]
  )

  const isButtonDisabled = hasErrors || !areRequiredFieldsFilled

  return {
    profileData,
    loading,
    errors,
    handleInputChange,
    handleSave,
    isButtonDisabled
  }
}
