import { formattedDate, formatPhoneNumber, formatErrorMessage, formatToTwoDecimalPlaces } from '../../src/utility/formatting'

describe('Utility Functions', () => {
  describe('formattedDate', () => {
    describe('formattedDate', () => {
      test('should format date string correctly', () => {
        const dateString = '2024-10-23T14:30:00Z'
        const expected = '10/23/2024, 8:30 PM'
        expect(formattedDate(dateString)).toBe(expected)
      })

      test('should format Date object correctly', () => {
        const dateObject = new Date('2024-10-23T14:30:00Z')
        const expected = '10/23/2024, 8:30 PM'
        expect(formattedDate(dateObject)).toBe(expected)
      })

      test('should handle invalid date input', () => {
        const invalidDate = 'invalid-date-string'
        const expected = 'Invalid Date'
        expect(formattedDate(invalidDate)).toBe(expected)
      })

      test('should handle empty string as input', () => {
        const expected = 'Invalid Date'
        expect(formattedDate('')).toBe(expected)
      })
    })

    test('should handle empty string as input', () => {
      const expected = 'Invalid Date'
      expect(formattedDate('')).toBe(expected)
    })
  })

  describe('formatPhoneNumber', () => {
    test('should format phone number starting with 01', () => {
      const input = '0123456789'
      const expected = '+880123456789'
      expect(formatPhoneNumber(input)).toBe(expected)
    })

    test('should return unmodified phone number if it does not start with 01', () => {
      const input = '+880123456789'
      const expected = '+880123456789'
      expect(formatPhoneNumber(input)).toBe(expected)
    })

    test('should trim whitespace from phone number', () => {
      const input = ' 0123456789 '
      const expected = '+880123456789'
      expect(formatPhoneNumber(input)).toBe(expected)
    })

    test('should handle empty string', () => {
      const expected = ''
      expect(formatPhoneNumber('')).toBe(expected)
    })

    test('should handle invalid phone number format', () => {
      const input = 'abcdefg'
      const expected = 'abcdefg'
      expect(formatPhoneNumber(input)).toBe(expected)
    })
  })

  describe('formatErrorMessage', () => {
    test('should return specific message for user already exists', () => {
      const error = new Error('user already exists')
      expect(formatErrorMessage(error)).toBe('User already exists, Please Login.')
    })

    test('should return specific message for network error', () => {
      const error = new Error('network error')
      expect(formatErrorMessage(error)).toBe('Please check your internet connection.')
    })

    test('should return specific message for timeout', () => {
      const error = new Error('timeout')
      expect(formatErrorMessage(error)).toBe('Request timed out, please try again later.')
    })

    test('should return specific message for invalid request body', () => {
      const error = new Error('invalid request body')
      expect(formatErrorMessage(error)).toBe('Please check your input and try again.')
    })

    test('should return generic message for unhandled error types', () => {
      const error = new Error('Some unexpected error')
      expect(formatErrorMessage(error)).toBe('Something went wrong.')
    })

    test('should handle plain string errors', () => {
      expect(formatErrorMessage('Plain string error')).toBe('Plain string error')
    })

    test('should handle object errors', () => {
      const error = { message: 'Object error' }
      expect(formatErrorMessage(error)).toBe('Error: {"message":"Object error"}')
    })

    test('should handle null/undefined errors', () => {
      expect(formatErrorMessage(null)).toBe('An unknown error occurred.')
      expect(formatErrorMessage(undefined)).toBe('An unknown error occurred.')
    })
  })

  describe('formatToTwoDecimalPlaces', () => {
    it('should format a valid numeric string to two decimal places', () => {
      expect(formatToTwoDecimalPlaces('123.456')).toBe(123.46)
    })

    it('should return 0 for a non-numeric string', () => {
      expect(formatToTwoDecimalPlaces('abc')).toBe(0)
    })

    it('should return 0 for an empty string', () => {
      expect(formatToTwoDecimalPlaces('')).toBe(0)
    })

    it('should handle whole numbers by adding .00', () => {
      expect(formatToTwoDecimalPlaces('100')).toBe(100.00)
    })

    it('should handle a number already at two decimal places without rounding', () => {
      expect(formatToTwoDecimalPlaces('123.45')).toBe(123.45)
    })

    it('should round down if third decimal place is less than 5', () => {
      expect(formatToTwoDecimalPlaces('123.454')).toBe(123.45)
    })

    it('should return 0 for NaN input like " " (whitespace)', () => {
      expect(formatToTwoDecimalPlaces(' ')).toBe(0)
    })
  })
})
