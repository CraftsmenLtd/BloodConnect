import {
  ACCOUNT_CREATION_MINIMUM_AGE,
  SHORT_DESCRIPTION_MAX_LENGTH
} from '../setup/constant/consts'
import { formattedDate } from './formatting'

type PasswordPolicy = {
  minimum_length: number;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_uppercase: boolean;
  require_symbols: boolean;
}

const passwordPolicy: PasswordPolicy = {
  minimum_length: 10,
  require_lowercase: true,
  require_numbers: true,
  require_uppercase: false,
  require_symbols: true
}

export const validateAndReturnRequiredFieldError = (
  value: string | string[] | boolean): string | null => {
  if (typeof value === 'string') {
    return value.trim().length === 0 ? 'This field is required' : null
  } else if (Array.isArray(value)) {
    return value.length === 0 ? 'This field is required' : null
  } else if (typeof value === 'boolean') {
    return value ? null : 'This field is required'
  }

  return null
}

export const validateEmailAndGetErrorMessage = (value: string): string | null => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

  return !emailRegex.test(value) ? 'Invalid email address' : null
}

export const validatePhoneNumberAndGetErrorMessage = (value: string): string | null => {
  const phoneRegex = /^(?:\+8801[3-9]\d{8}|01[3-9]\d{8})$/

  return !phoneRegex.test(value) ? 'Invalid phone number' : null
}

export const checkErrorsInPassword = (value: string): string | null => {
  const tests = [
    {
      test: value.length >= passwordPolicy.minimum_length,
      error: `Min ${passwordPolicy.minimum_length} chars`
    },
    {
      test: !passwordPolicy.require_lowercase || /[a-z]/.test(value),
      error: '1 lowercase'
    },
    {
      test: !passwordPolicy.require_uppercase || /[A-Z]/.test(value),
      error: '1 uppercase'
    },
    {
      test: !passwordPolicy.require_numbers || /\d/.test(value),
      error: '1 number'
    },
    {
      test: !passwordPolicy.require_symbols || /[!@#$%^&*(),.?":{}|<>]/.test(value),
      error: '1 symbol'
    }
  ]
  const errors = tests
    .filter(({ test }) => !test)
    .map(({ error }) => error)
    .join(', ')

  return (errors !== '') ? `Password must contain: ${errors}` : null
}

export const validateDonationDateTime = (donationDateTime: string): string | null => {
  const now = new Date()
  const donationDate = new Date(donationDateTime)

  const minAllowedDate = new Date(now.getTime() + 5 * 60 * 1000)
  if (donationDate < minAllowedDate) {
    return 'Donation date & time must be at least 5 minutes ahead.'
  }

  return null
}

export const validateDonationDateTimeWithin24Hours = (donationDateTime: string): string | null => {
  const now = new Date()
  const donationDate = new Date(donationDateTime)

  const maxAllowedDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const endOfNextDay = new Date(now)
  endOfNextDay.setDate(endOfNextDay.getDate() + 1)
  endOfNextDay.setHours(23, 59, 59, 999)

  const actualMaxAllowedDate = maxAllowedDate < endOfNextDay ? endOfNextDay : maxAllowedDate

  if (donationDate > actualMaxAllowedDate) {
    return `Donation date & time must be before ${formattedDate(actualMaxAllowedDate)}.`
  }

  return null
}

export const validatePastOrTodayDate = (date: string): string | null => {
  const today = new Date()
  const inputDate = new Date(date)

  today.setHours(0, 0, 0, 0)
  inputDate.setHours(0, 0, 0, 0)

  if (inputDate.getTime() >= today.getTime()) {
    return 'The date must be today or in the past.'
  }

  return null
}

export const validateDateOfBirth = (dateOfBirth: string): string | null => {
  const today = new Date()
  const dob = new Date(dateOfBirth)

  const age = today.getFullYear() - dob.getFullYear()
  const hasBirthdayPassedThisYear
    = today.getMonth() > dob.getMonth()
    || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())

  const actualAge = hasBirthdayPassedThisYear ? age : age - 1

  if (actualAge < ACCOUNT_CREATION_MINIMUM_AGE) {
    return `User must be at least ${ACCOUNT_CREATION_MINIMUM_AGE} years old.`
  }

  return null
}

export const validateHeight = (height: string): string | null => {
  if (height === '' || height === null || height === undefined || height === '0.0') {
    return null
  }

  const heightValue = parseFloat(height)

  if (isNaN(heightValue)) {
    return 'Height must be a valid number'
  }

  if (heightValue < 3.0 || heightValue > 8.0) {
    return 'Height must be between 3.0 and 8.0 feet'
  }

  return null
}

export const validateWeight = (weight: number): string | null => {
  if (weight === 0.0 || weight === null || weight === undefined) {
    return null
  }

  if (isNaN(weight)) {
    return 'Weight must be a valid number'
  }

  if (weight < 30 || weight > 300) {
    return 'Weight must be between 30 and 300 kg'
  }

  return null
}

const validateShortDescription = (value: string): string | null => {
  const tests = [
    {
      test: value.length > SHORT_DESCRIPTION_MAX_LENGTH,
      error: `Short description must not exceed ${SHORT_DESCRIPTION_MAX_LENGTH} characters.`
    }
  ]

  const error = tests.find(({ test }) => test)?.error

  return error ?? null
}

export type ValidationRule = (value: unknown) => string | null

export const validateInput = (value: unknown, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    const error = rule(value)
    if (error !== null) {
      return error
    }
  }

  return null
}

const validateRequiredFieldsTruthy = <D>(
  validationRules: Record<string, ValidationRule[]>,
  data: D): boolean => {
  for (const key in validationRules) {
    const validationFailed = validationRules[key].some(
      (func) => func(data[key]) !== null)
    if (validationFailed) {
      return false
    }
  }

  return true
}


export {
  validateShortDescription,
  validateAndReturnRequiredFieldError as validateRequired,
  validateEmailAndGetErrorMessage as validateEmail,
  validatePhoneNumberAndGetErrorMessage as validatePhoneNumber,
  checkErrorsInPassword as validatePassword,
  validateDonationDateTime as validateDateTime,
  validateRequiredFieldsTruthy
}
