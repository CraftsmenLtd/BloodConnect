import { formatteDate, formatPhoneNumber, formatErrorMessage, formatToTwoDecimalPlaces } from '../../src/utility/formatte'

describe('Utility Functions', () => {
  describe('formatteDate', () => {
    describe('formatteDate', () => {
      test('should format date string correctly', () => {
        const dateString = '2024-10-23T14:30:00Z'
        const expected = '10/23/2024, 2:30 PM'
        expect(formatteDate(dateString)).toBe(expected)
      })

      test('should format Date object correctly', () => {
        const dateObject = new Date('2024-10-23T14:30:00Z')
        const expected = '10/23/2024, 2:30 PM'
        expect(formatteDate(dateObject)).toBe(expected)
      })

      test('should handle invalid date input', () => {
        const invalidDate = 'invalid-date-string'
        const expected = 'Invalid Date'
        expect(formatteDate(invalidDate)).toBe(expected)
      })

      test('should handle empty string as input', () => {
        const expected = 'Invalid Date'
        expect(formatteDate('')).toBe(expected)
      })
    })

    test('should handle empty string as input', () => {
      const expected = 'Invalid Date'
      expect(formatteDate('')).toBe(expected)
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
      const error = new Error('User already exists')
      const expected = 'User already exists, Please Login.'
      expect(formatErrorMessage(error)).toBe(expected)
    })

    test('should return specific message for network error', () => {
      const error = new Error('Network error')
      const expected = 'Please check your internet connection.'
      expect(formatErrorMessage(error)).toBe(expected)
    })

    test('should return specific message for timeout error', () => {
      const error = new Error('Request timeout')
      const expected = 'Request timed out, Please try again later.'
      expect(formatErrorMessage(error)).toBe(expected)
    })

    test('should return a generic message for unexpected errors', () => {
      const error = new Error('Some unexpected error')
      const expected = 'An unexpected error occurred: Some unexpected error'
      expect(formatErrorMessage(error)).toBe(expected)
    })

    test('should return a message for unknown error types', () => {
      const error = {}
      const expected = 'An unknown error occurred.'
      expect(formatErrorMessage(error)).toBe(expected)
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
