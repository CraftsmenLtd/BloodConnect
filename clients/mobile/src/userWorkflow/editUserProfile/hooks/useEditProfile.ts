import { useEffect, useState } from 'react'
import type {
  ValidationRule
} from '../../../utility/validator'
import {
  validateDateOfBirth,
  validateHeight,
  validateInput,
  validatePastOrTodayDate,
  validateRequired,
  validateRequiredFieldsTruthy,
  validateWeight
} from '../../../utility/validator'
import { useRoute } from '@react-navigation/native'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { initializeState } from '../../../utility/stateUtils'
import { Alert } from 'react-native'
import { useUserProfile } from '../../context/UserProfileContext'
import useFetchData from '../../../setup/clients/useFetchData'
import { updateUserProfile } from '../../services/userProfileService'
import type {
  EditProfileRouteProp,
} from '../../../setup/navigation/navigationTypes'
import type { EditProfileData } from '../../userProfile/UI/Profile'
import Constants from 'expo-constants'
import { formatLocations } from '../../../utility/formatting'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

type ProfileFields = keyof Omit<ProfileData, 'location'>

type ProfileData = {
  [K in keyof EditProfileData as K extends string
  ? (string extends K ? never : K) : never]: EditProfileData[K];
} & {
  weight: number | undefined;
  availableForDonation: boolean;
}

type ProfileDataErrors = {
  [key in ProfileFields]?: string | null;
}

const validationRules: Record<keyof Omit<ProfileData, 'location'>, ValidationRule[]> = {
  name: [validateRequired],
  dateOfBirth: [validateDateOfBirth, validateRequired],
  weight: [validateWeight],
  height: [validateHeight],
  gender: [validateRequired],
  phone: [validateRequired],
  preferredDonationLocations: [validateRequired],
  lastDonationDate: [validatePastOrTodayDate],
  locations: [],
  availableForDonation: []
}

export const useEditProfile = () => {
  const { fetchUserProfile, updateUserProfileContext, userProfile } = useUserProfile()
  const route = useRoute<EditProfileRouteProp>()
  const fetchClient = useFetchClient()
  const { userDetails } = route.params

  const [profileData, setProfileData] = useState<ProfileData>(() => {
    if (!userProfile) {
      throw new Error('User profile not loaded')
    }

    if (!Array.isArray(userProfile.phoneNumbers) || userProfile.phoneNumbers.length === 0) {
      throw new Error('userProfile.phoneNumbers must contain at least one value')
    }

    return {
      phone: userProfile.phoneNumbers[0],
      weight: userProfile.weight ?? 0, // Provide defaults for optional fields
      height: userProfile.height ?? '',
      dateOfBirth: userProfile.dateOfBirth ?? '',
      name: userProfile.name ?? '',
      gender: userProfile.gender,
      lastDonationDate: userProfile.lastDonationDate ?? '',
      preferredDonationLocations: userProfile.preferredDonationLocations ?? [],
      locations: userProfile.locations ?? [],
      availableForDonation: userProfile.availableForDonation,
      ...userProfile
    }
  })

  const [pendingAvailableForDonationSave, setPendingAvailableForDonationSave] = useState(false)
  const [errors, setErrors] = useState<ProfileDataErrors>(
    initializeState<ProfileDataErrors>(Object.keys(validationRules) as ProfileFields[], null)
  )

  useEffect(() => {
    if (userProfile) {
      setProfileData((prev) => ({
        ...prev,
        ...userProfile,
        phone: prev.phone
      }))
    }
  }, [userProfile])

  const [executeUpdateProfile, loading, updateError] = useFetchData(
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

  const [executeUserAvailableForDonationProfile] = useFetchData(
    async(payload: Partial<ProfileData>) => {
      const response = await updateUserProfile(payload, fetchClient)
      if (response.status !== 200) {
        throw new Error('Failed to update user available for donation status')
      }
    },
    {
      parseError: (error) => (error instanceof Error ? error.message : 'Unknown error')
    }
  )

  const handleInputChange = (field: ProfileFields, value: unknown): void => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value
    }))

    handleInputValidation(field, value as string)
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
    validationFields.forEach((field) => {
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
      (location) => !rest.preferredDonationLocations.some(
        (preferred) => preferred.area === location)
    )
    const updatedPreferredDonationLocations = rest.preferredDonationLocations.filter(
      (preferred) => rest.locations.includes(preferred.area)
    )

    const requestPayload = {
      ...rest,

      weight: Number.isNaN(rest.weight) ? 0 : rest.weight,
      height: rest.height !== '' ? rest.height : '0.0',

      preferredDonationLocations: [
        ...updatedPreferredDonationLocations,
        ...await formatLocations(filteredLocations, API_BASE_URL)
      ]
    }

    await executeUpdateProfile(requestPayload)
    if (updateError !== null) {
      Alert.alert('Error', 'Could not update profile.')
    }
  }

  useEffect(() => {
    if (pendingAvailableForDonationSave) {
      void handleUpdateAvailableForDonation().finally(() =>
        setPendingAvailableForDonationSave(false)
      )
    }
  }, [profileData.availableForDonation])

  const handleUpdateAvailableForDonation = async(): Promise<void> => {
    const requestPayload = {
      availableForDonation: profileData.availableForDonation
    }

    await executeUserAvailableForDonationProfile(requestPayload)
    if (updateError !== null) {
      Alert.alert('Error', 'Could not update available for donation value.')
    }

    void updateUserProfileContext({ availableForDonation: requestPayload.availableForDonation })
  }

  const isButtonDisabled = !validateRequiredFieldsTruthy<ProfileData>(
    validationRules, profileData)

  return {
    profileData,
    loading,
    errors,
    handleInputChange,
    handleSave,
    isButtonDisabled,
    setPendingAvailableForDonationSave
  }
}
