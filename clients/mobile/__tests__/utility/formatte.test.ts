import { formatteDate, formatPhoneNumber, formatErrorMessage } from '../../src/utility/formatte'

describe('Utility Functions', () => {
  describe('formatteDate', () => {
    describe('formatteDate', () => {
      test('should format date string correctly', () => {
        const dateString = '2024-10-23T14:30:00Z' // This is in UTC
        const expected = '10/23/2024, 2:30 PM' // Expected output in UTC
        expect(formatteDate(dateString)).toBe(expected)
      })

      test('should format Date object correctly', () => {
        const dateObject = new Date('2024-10-23T14:30:00Z') // This is in UTC
        const expected = '10/23/2024, 2:30 PM' // Expected output in UTC
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
      const expected = 'Please check your connection.'
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
})
