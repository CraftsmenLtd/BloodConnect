import { ACCOUNT_CREATION_MINIMUM_AGE } from '../../src/setup/constant/consts'
import {
  validateRequired,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateInput,
  validateDateOfBirth,
  validateHeight,
  validatePastOrTodayDate,
  validateWeight
} from '../../src/utility/validator'

describe('Validation Functions', () => {
  describe('validateRequired', () => {
    it('should return error message if the field is empty or whitespace', () => {
      expect(validateRequired('')).toBe('This field is required')
      expect(validateRequired('   ')).toBe('This field is required')
    })

    it('should return null if the field is not empty', () => {
      expect(validateRequired('value')).toBeNull()
    })
  })

  describe('validateEmail', () => {
    it('should return error message if the email is invalid', () => {
      expect(validateEmail('invalid-email')).toBe('Invalid email address')
      expect(validateEmail('ebrahim@com')).toBe('Invalid email address')
      expect(validateEmail('@example.com')).toBe('Invalid email address')
    })

    it('should return null if the email is valid', () => {
      expect(validateEmail('ebrahim@example.com')).toBeNull()
      expect(validateEmail('user.name+tag@sub.example.co.in')).toBeNull()
    })
  })

  describe('validatePhoneNumberAndGetErrorMessage', () => {
    it('should return error message if the phone number is invalid', () => {
      expect(validatePhoneNumber('12345')).toBe('Invalid phone number')
      expect(validatePhoneNumber('+')).toBe('Invalid phone number')
      expect(validatePhoneNumber('++123')).toBe('Invalid phone number')
      expect(validatePhoneNumber('+88012345678')).toBe('Invalid phone number')
      expect(validatePhoneNumber('0123456789')).toBe('Invalid phone number')
    })

    it('should return null if the phone number is valid', () => {
      expect(validatePhoneNumber('+8801323456789')).toBeNull()
      expect(validatePhoneNumber('+8801987654321')).toBeNull()
      expect(validatePhoneNumber('01323456789')).toBeNull()
      expect(validatePhoneNumber('01787654321')).toBeNull()
    })
  })

  describe('validatePassword', () => {
    it('should return error message if the password does not meet the policy requirements', () => {
      expect(validatePassword('short')).toBe('Password must contain: Min 10 chars, 1 number, 1 symbol')
      expect(validatePassword('ALLUPPERCASE1!')).toBe('Password must contain: 1 lowercase')
      expect(validatePassword('NoNumbersAndSymbols')).toBe('Password must contain: 1 number, 1 symbol')
      expect(validatePassword('NoNumbers!!')).toBe('Password must contain: 1 number')
      expect(validatePassword('NoSymbols1234')).toBe('Password must contain: 1 symbol')
      expect(validatePassword('')).toBe('Password must contain: Min 10 chars, 1 lowercase, 1 number, 1 symbol')
      expect(validatePassword('!!!!!!@@@@@')).toBe('Password must contain: 1 lowercase, 1 number')
      expect(validatePassword('1234567890')).toBe('Password must contain: 1 lowercase, 1 symbol')
      expect(validatePassword('abcdefghij')).toBe('Password must contain: 1 number, 1 symbol')
      expect(validatePassword('abcdef12345')).toBe('Password must contain: 1 symbol')
    })

    it('should return null if the password meets the policy requirements', () => {
      expect(validatePassword('Valid1234!')).toBeNull()
      expect(validatePassword('alllowercase1!')).toBeNull()
      expect(validatePassword('abcdefghijk1!')).toBeNull()
      expect(validatePassword('lowercase1234!')).toBeNull()
      expect(validatePassword('abcdEFG123!')).toBeNull()
    })
  })

  describe('validateInput', () => {
    it('should validate using multiple rules and return the first error', () => {
      const rules = [validateRequired, validateEmail]
      expect(validateInput('', rules)).toBe('This field is required')
      expect(validateInput('invalid-email', rules)).toBe('Invalid email address')
    })

    it('should return null if no validation rules fail', () => {
      const rules = [validateRequired, validateEmail]
      expect(validateInput('ebrahim@example.com', rules)).toBeNull()
    })
  })

  describe('validatePastOrTodayDate', () => {
    it('should return error message for today\'s date', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(validatePastOrTodayDate(today)).toBe('The date must be today or in the past.')
    })

    it('should return null for past dates', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      expect(validatePastOrTodayDate(pastDate)).toBeNull()
    })

    it('should return error message for future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2)
      const futureDateString = futureDate.toISOString().split('T')[0]

      expect(validatePastOrTodayDate(futureDateString)).toBe('The date must be today or in the past.')
    })
  })

  describe('validateDateOfBirth', () => {
    it('should return error message for ages under 18', () => {
      const today = new Date()
      const fourteenYearsAgo = new Date(today)
      fourteenYearsAgo.setFullYear(today.getFullYear() - 14)
      expect(validateDateOfBirth(fourteenYearsAgo.toISOString().split('T')[0])).toBe(`User must be at least ${ACCOUNT_CREATION_MINIMUM_AGE} years old.`)
    })

    it('should return null for ages 18 and over', () => {
      const today = new Date()
      const fifteenYearsAgo = new Date(today)
      fifteenYearsAgo.setFullYear(today.getFullYear() - 19)
      expect(validateDateOfBirth(fifteenYearsAgo.toISOString().split('T')[0])).toBeNull()
    })
  })

  describe('validateHeight', () => {
    it('should return null for valid height', () => {
      expect(validateHeight('5.5')).toBeNull()
    })

    it('should return error message for invalid height values', () => {
      expect(validateHeight('2.5')).toBe('Height must be between 3.0 and 8.0 feet')
      expect(validateHeight('9.0')).toBe('Height must be between 3.0 and 8.0 feet')
      expect(validateHeight('abc')).toBe('Height must be a valid number')
    })
  })

  describe('validateWeight', () => {
    it('should return null for valid weight', () => {
      expect(validateWeight('70')).toBeNull()
    })

    it('should return error message for invalid weight values', () => {
      expect(validateWeight('25')).toBe('Weight must be between 30 and 300 kg')
      expect(validateWeight('350')).toBe('Weight must be between 30 and 300 kg')
      expect(validateWeight('xyz')).toBe('Weight must be a valid number')
    })
  })
})
