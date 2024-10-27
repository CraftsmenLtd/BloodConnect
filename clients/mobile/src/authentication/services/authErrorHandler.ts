export const handleAuthError = (error: unknown): string => {
  let errorMessage = 'Unknown error occurred.'

  if (error instanceof Error) {
    switch (error.name) {
      case 'NotAuthorizedException':
        errorMessage = 'Unauthorized to sign out.'
        break
      case 'NetworkError':
        errorMessage = 'Network error. Check your connection.'
        break
      case 'UsernameExistsException':
        errorMessage = 'Account already exists.'
        break
      case 'InvalidPasswordException':
        errorMessage = 'Weak password. Use a stronger one.'
        break
      case 'InvalidParameterException':
        errorMessage = 'Invalid input. Check your details.'
        break
      case 'LimitExceededException':
        errorMessage = 'Too many requests. Try again later.'
        break
      case 'CodeMismatchException':
        errorMessage = 'Invalid OTP code. Please try again.'
        break
      case 'ExpiredCodeException':
        errorMessage = 'OTP code has expired. Request a new one.'
        break
      case 'UserNotFoundException':
        errorMessage = 'No account found with this email.'
        break
      default:
        errorMessage = `${error instanceof Error ? error.message : 'Unknown issue.'}`
        break
    }
  } else {
    errorMessage = 'Something went wrong.'
  }

  return errorMessage
}
