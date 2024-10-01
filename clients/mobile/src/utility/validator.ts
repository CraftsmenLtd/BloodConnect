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

export const validateAndReturnRequiredFieldError = (value: string): string | null => {
  return value.trim().length === 0 ? 'This field is required' : null
}

export const validateEmailAndGetErrorMessage = (value: string): string | null => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return !emailRegex.test(value) ? 'Invalid email address' : null
}

export const validatePhoneNumberAndGetErrorMessage = (value: string): string | null => {
  const phoneRegex = /^[+]{1}(?:[0-9\-()/.]\s?){6,15}[0-9]{1}$/
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

export type ValidationRule = (value: string) => string | null

export const validateInput = (value: string, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    const error = rule(value)
    if (error !== null) {
      return error
    }
  }
  return null
}

export {
  validateAndReturnRequiredFieldError as validateRequired,
  validateEmailAndGetErrorMessage as validateEmail,
  validatePhoneNumberAndGetErrorMessage as validatePhoneNumber,
  checkErrorsInPassword as validatePassword
}
