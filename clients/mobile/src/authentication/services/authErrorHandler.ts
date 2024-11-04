export const handleAuthError = (error: unknown): string => {
  if (error instanceof Error) {
    switch (error.name) {
      case 'NotAuthorizedException':
        return 'Your account is not confirmed. Please confirm your account first.'
      case 'NetworkError':
        return 'Network error. Check your connection.'
      case 'UsernameExistsException':
        return 'Account already exists.'
      case 'InvalidPasswordException':
        return 'Weak password. Use a stronger one.'
      case 'InvalidParameterException':
        return 'Invalid input. Check your details.'
      case 'LimitExceededException':
        return 'Too many requests. Try again later.'
      case 'CodeMismatchException':
        return 'Invalid OTP code. Please try again.'
      case 'ExpiredCodeException':
        return 'OTP code has expired. Request a new one.'
      case 'UserNotFoundException':
        return 'No account found with this email.'
      default:
        return `${error instanceof Error ? error.message : 'Unknown issue.'}`
    }
  } else {
    return 'Something went wrong.'
  }
}
