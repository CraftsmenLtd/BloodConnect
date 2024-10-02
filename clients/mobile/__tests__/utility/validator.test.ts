import {
  validateRequired,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateInput
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

  describe('validatePhoneNumber', () => {
    it('should return error message if the phone number is invalid', () => {
      expect(validatePhoneNumber('12345')).toBe('Invalid phone number')
      expect(validatePhoneNumber('+')).toBe('Invalid phone number')
      expect(validatePhoneNumber('++123')).toBe('Invalid phone number')
    })

    it('should return null if the phone number is valid', () => {
      expect(validatePhoneNumber('+1234567890')).toBeNull()
      expect(validatePhoneNumber('+14155552671')).toBeNull()
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
})
