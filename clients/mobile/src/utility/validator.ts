interface PasswordPolicy {
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

export const isRequired = (value: string): string => {
  return value.trim().length === 0 ? 'This field is required' : ''
}

export const isValidEmail = (value: string): string => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return !emailRegex.test(value) ? 'Invalid email address' : ''
}

export const isValidPhoneNumber = (value: string): string => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return !phoneRegex.test(value) ? 'Invalid phone number' : ''
}

export const isValidPassword = (value: string): string => {
  let errorMsg = ''

  if (value.length < passwordPolicy.minimum_length) {
    errorMsg += `Min ${passwordPolicy.minimum_length} chars. `
  }

  if (passwordPolicy.require_lowercase && !/[a-z]/.test(value)) {
    errorMsg += '1 lowercase. '
  }

  if (passwordPolicy.require_uppercase && !/[A-Z]/.test(value)) {
    errorMsg += '1 uppercase. '
  }

  if (passwordPolicy.require_numbers && !/\d/.test(value)) {
    errorMsg += '1 number. '
  }

  if (passwordPolicy.require_symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    errorMsg += '1 symbol. '
  }

  return errorMsg.trim().length === 0 ? '' : 'Password must contain:' + errorMsg.trim()
}

export type ValidationRule = (value: string) => string

export const validateInput = (value: string, rules: ValidationRule[]): string => {
  for (const rule of rules) {
    const error = rule(value)
    if (error !== '') {
      return error
    }
  }
  return ''
}
