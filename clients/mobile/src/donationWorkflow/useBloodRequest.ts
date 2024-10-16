import { useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { validateInput, validateRequired, ValidationRule, validatePhoneNumber } from '../utility/validator'
import { initializeState } from '../utility/stateUtils'

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
  donationDateTime: [validateRequired],
  location: [validateRequired],
  contactNumber: [validateRequired, validatePhoneNumber]
}

export const useBloodRequest = (): any => {
  const [bloodRequestData, setBloodRequestData] = useState<BloodRequestData>({
    urgencyLevel: 'regular',
    neededBloodGroup: '',
    bloodQuantity: '',
    donationDateTime: new Date(),
    location: '',
    contactNumber: '',
    patientName: '',
    shortDescription: '',
    transportationInfo: ''
  })
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [errors, setErrors] = useState<BloodRequestDataErrors>(initializeState<BloodRequestDataErrors>(
    Object.keys(validationRules) as Array<keyof BloodRequestDataErrors>, null)
  )

  const onDateChange = (selectedDate): void => {
    const currentDate = selectedDate
    setShowDatePicker(false)
    setBloodRequestData(prevState => ({
      ...prevState,
      donationDateTime: new Date(currentDate)
    }))
    console.log(currentDate)
  }

  const handleInputChange = (name: CredentialKeys, value: string): void => {
    // console.log(name, value)

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

  const validateForm = (): null | string => {
    return null
  }

  const handlePostNow = (): void => {
    console.log(bloodRequestData)
    console.log(errors)
    Alert.alert('Success', 'Form submitted successfully!')
  }

  return {
    errors,
    setErrors,
    showDatePicker,
    setShowDatePicker,
    isButtonDisabled,
    bloodRequestData,
    handleInputChange,
    handlePostNow,
    validateForm
  }
}
