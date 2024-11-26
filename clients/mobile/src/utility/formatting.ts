export const formattedDate = (date: string | Date, showOnlyDate = false): string => {
  const dte = new Date(date)

  return dte.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(showOnlyDate ? {} : { hour: 'numeric', minute: '2-digit', hour12: true })
  })
}

export const formatPhoneNumber = (phoneNumber: string): string => {
  const trimmedPhoneNumber = phoneNumber.trim()

  return trimmedPhoneNumber.startsWith('01')
    ? trimmedPhoneNumber.replace('01', '+8801')
    : trimmedPhoneNumber
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === 'string') {
    const errorMessage = error.message.toLowerCase()
    if (errorMessage.startsWith('failed to retrieve coordinates for')) {
      return 'Couldn\'t retrieve coordinates for the location. Please try again.'
    }
    switch (errorMessage) {
      case 'user already exists':
        return 'User already exists, Please Login.'
      case 'invalid request body':
        return 'Please check your input and try again.'
      case 'network error':
        return 'Please check your internet connection.'
      case 'timeout':
        return 'Request timed out, please try again later.'
      default:
        return 'Something went wrong.'
    }
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return 'Error: ' + JSON.stringify(error)
    } catch {
      return 'An error occurred but could not be displayed.'
    }
  }

  return 'An unknown error occurred.'
}

export const formatToTwoDecimalPlaces = (value: string): number => {
  const numValue = parseFloat(value)
  return isNaN(numValue) ? 0 : parseFloat(numValue.toFixed(2))
}
