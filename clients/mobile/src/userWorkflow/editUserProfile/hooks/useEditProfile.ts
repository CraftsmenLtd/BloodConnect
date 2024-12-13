import { useMemo, useState } from 'react'
import {
  validateDateOfBirth,
  validateHeight, validatePhoneNumber,
  validateRequired, validateWeight,
  ValidationRule
} from '../../../utility/validator'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { initializeState } from '../../../utility/stateUtils'
import { Alert } from 'react-native'

interface UseEditProfileResult {
  profileData: typeof profileData;
  errors: ProfileDataErrors;
  handleInputChange: (field: keyof ProfileDataErrors, value: any) => void;
  handleSave: () => Promise<void>;
  isButtonDisabled: boolean;
}

interface ProfileDataErrors {
  name?: string;
  dateOfBirth?: string;
  weight?: string;
  height?: string;
  gender?: string;
  phone?: string;
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

export const useEditProfile = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>()
  const fetchClient = useFetchClient()
  const { userDetails } = route.params
  const [profileData, setProfileData] = useState({
    ...userDetails,
    phone: userDetails.phoneNumbers[0]
  })
  //   console.log('profileData: ', profileData)
  const [errors, setErrors] = useState<ProfileDataErrors>(
    initializeState<ProfileDataErrors>(Object.keys(validationRules) as Array<keyof ProfileDataErrors>, null)
  )

  const handleInputChange = (field: keyof ProfileDataErrors, value: any) => {
    // console.log(field, ' ', value)
    setProfileData((prev) => ({
      ...prev,
      [field]: value
    }))

    setErrors((prevErrors) => ({
      ...prevErrors,
      [field]: validateField(field, value)
    }))
  }

  const validateField = (field: keyof ProfileDataErrors, value: any): string | undefined => {
    const rules = validationRules[field]
    if (!rules) return undefined

    for (const rule of rules) {
      const error = rule(value)
      if (error) return error
    }

    return undefined
  }

  const handleSave = async() => {
    const newErrors: ProfileDataErrors = {}
    Object.keys(validationRules).forEach((field) => {
      const key = field as keyof ProfileDataErrors
      newErrors[key] = validateField(key, profileData[key])
    })

    setErrors(newErrors)

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
      if (response.status !== 200) throw new Error('Failed to update profile')
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
