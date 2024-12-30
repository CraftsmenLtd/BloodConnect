import { useMemo, useState } from 'react'
import {
  validateDateOfBirth,
  validateHeight, validateInput, validatePhoneNumber,
  validateRequired, validateWeight,
  ValidationRule
} from '../../../utility/validator'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { initializeState } from '../../../utility/stateUtils'
import { Alert } from 'react-native'
import { useUserProfile } from '../../context/UserProfileContext'

type ProfileFields = keyof ProfileData

interface ProfileData {
  phone: string;
  weight: string;
  height: string;
  dateOfBirth: string;
  name: string;
  gender: string;
  [key: string]: any;
}

interface UseEditProfileResult {
  profileData: ProfileData;
  errors: ProfileDataErrors;
  handleInputChange: (field: keyof ProfileFields, value: any) => void;
  handleSave: () => Promise<void>;
  isButtonDisabled: boolean;
}

type ProfileDataErrors = {
  [key in ProfileFields]?: string | null;
}

interface RouteParams {
  userDetails: {
    phoneNumbers: string[];
    name: string;
    dateOfBirth: string;
    weight: string;
    height: string;
    gender: string;
    [key: string]: any;
  };
}

const validationRules: Record<keyof ProfileDataErrors, ValidationRule[]> = {
  name: [validateRequired],
  dateOfBirth: [validateDateOfBirth, validateRequired],
  weight: [validateRequired, validateWeight],
  height: [validateRequired, validateHeight],
  gender: [validateRequired],
  phone: [validateRequired, validatePhoneNumber]
}

export const useEditProfile = (): UseEditProfileResult => {
  const { fetchUserProfile } = useUserProfile()
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>()
  const fetchClient = useFetchClient()
  const { userDetails } = route.params
  const [profileData, setProfileData] = useState({
    ...userDetails,
    phone: userDetails.phoneNumbers[0]
  })
  const [errors, setErrors] = useState<ProfileDataErrors>(
    initializeState<ProfileDataErrors>(Object.keys(validationRules) as ProfileFields[], null)
  )

  const handleInputChange = (field: keyof ProfileFields, value: string): void => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value
    }))

    handleInputValidation(field, value)
  }

  const handleInputValidation = (field: ProfileFields, value: string): void => {
    const errorMsg = validateInput(value, validationRules[field])
    setErrors((prevErrors) => ({
      ...prevErrors,
      [field]: errorMsg
    }))
  }

  // const validateField = (field: keyof ProfileDataErrors, value: any): string | undefined => {
  //   const rules = validationRules[field]
  //   if (rules === null || rules === undefined) return undefined

  //   for (const rule of rules) {
  //     const error = rule(value)
  //     if (error !== null) return error
  //   }

  //   return undefined
  // }

  const handleSave = async(): Promise<void> => {
    const newErrors: Partial<ProfileData> = {};

    (Object.keys(validationRules) as Array<keyof ProfileData>).forEach((field) => {
      const value = profileData[field]
      const rules = validationRules[field]
      newErrors[field] = validateInput(value, rules)
    })

    setErrors(newErrors as ProfileData)

    if (Object.values(newErrors).some((error) => error)) {
      Alert.alert('Validation Error', 'Please fix the highlighted errors.')
      return
    }

    const { phone, ...rest } = profileData
    userDetails.phoneNumbers[0] = phone

    try {
      const requestPayload = {
        ...rest,
        weight: parseFloat(profileData.weight),
        height: parseFloat(profileData.height)
      }

      const response = await fetchClient.patch('/users', requestPayload)
      if (response.status !== 200) {
        throw new Error('Failed to update profile')
      } else {
        await fetchUserProfile()
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update profile.')
    }
  }

  const isButtonDisabled = useMemo(() => {
    const hasErrors = Object.values(errors).some((error) => error !== undefined && error !== null)
    const requiredFieldsFilled = Object.keys(validationRules).every((key: string) => {
      const value = profileData[key as keyof typeof profileData]
      if (typeof value === 'string') {
        return value.trim() !== ''
      } else if (value instanceof Date) {
        return !isNaN(value.getTime())
      } else if (typeof value === 'number') {
        return !isNaN(value)
      } else if (value === null || value === undefined) {
        return false
      }
      return true
    })

    return hasErrors || !requiredFieldsFilled
  }, [errors, profileData])

  return {
    profileData,
    errors,
    handleInputChange,
    handleSave,
    isButtonDisabled
  }
}
