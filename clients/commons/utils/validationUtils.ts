const PASSWORD_MINIMUM_LENGTH = Number(process.env.PASSWORD_MINIMUM_LENGTH)

type ValidationResult = {
  message: string;
  isValid: boolean;
}

export const validatePassword = (
  password: string,
  confirmPassword: string
): {
  passwordResults: ValidationResult[];
  confirmPasswordResult: ValidationResult;
} => {
  const tests = [
    {
      test: password.length >= PASSWORD_MINIMUM_LENGTH,
      message: `Min ${PASSWORD_MINIMUM_LENGTH} characters.`
    },
    {
      test: /[A-Z]/.test(password),
      message: 'At least one uppercase letter.'
    },
    {
      test: /[a-z]/.test(password),
      message: 'At least one lowercase letter.'
    },
    {
      test: /\d/.test(password),
      message: 'At least one number.'
    },
    {
      test: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      message: 'At least one special character.'
    }
  ]

  const passwordResults = tests.map(({ test, message }) => ({
    message,
    isValid: test
  }))

  const confirmPasswordResult: ValidationResult = {
    message: password === confirmPassword ? 'Passwords match.' : 'Passwords do not match.',
    isValid: password === confirmPassword
  }

  return { passwordResults, confirmPasswordResult }
}
