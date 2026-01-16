import type { ValidationRule } from '../../utils/validator'
import { validateDonationDateTime, validateBloodQuantity, validateInputWithRules } from '../../utils/validator'

describe('Validation Functions', () => {
  describe('validateDonationDateTime', () => {
    test('should pass when the donationDateTime is in the future', () => {
      const futureDate = new Date(Date.now() + 10000).toISOString()
      expect(() => validateDonationDateTime(futureDate)).not.toThrow()
    })

    test('should throw an error if donationDateTime is in the past', () => {
      const pastDate = new Date(Date.now() - 10000).toISOString()
      expect(() => validateDonationDateTime(pastDate)).toThrow('Donation date & time cannot be in the past.')
    })
  })

  describe('validateBloodQuantity', () => {
    test('should pass when the bloodQuantity is between 1 and 10', () => {
      expect(() => validateBloodQuantity(5)).not.toThrow()
    })

    test('should throw an error when bloodQuantity is less than 1', () => {
      expect(() => validateBloodQuantity(0)).toThrow('Blood quantity must be between 1 and 10.')
    })

    test('should throw an error when bloodQuantity is greater than 10', () => {
      expect(() => validateBloodQuantity(11)).toThrow('Blood quantity must be between 1 and 10.')
    })
  })

  describe('validateInputWithRules', () => {
    const mockValidationRules = {
      bloodQuantity: [validateBloodQuantity as ValidationRule<unknown>],
      donationDateTime: [validateDonationDateTime as ValidationRule<unknown>]
    }

    test('should return null for valid inputs', () => {
      const result = validateInputWithRules(
        { bloodQuantity: 5, donationDateTime: new Date(Date.now() + 3600000).toISOString() },
        mockValidationRules
      )

      expect(result).toBeNull()
    })

    test('should return an error message for invalid blood quantity', () => {
      const result = validateInputWithRules(
        { bloodQuantity: 11, donationDateTime: new Date().toISOString() },
        mockValidationRules
      )

      expect(result).toBe('Blood quantity must be between 1 and 10.')
    })

    test('should return an error message for invalid donation date time', () => {
      const pastDate = new Date(Date.now() - 10000).toISOString()
      const result = validateInputWithRules(
        { bloodQuantity: 5, donationDateTime: pastDate },
        mockValidationRules
      )

      expect(result).toBe('Donation date & time cannot be in the past.')
    })

    test('should return formatted error when validator returns string instead of throwing', () => {
      const stringValidationRule: ValidationRule<unknown> = (value: unknown) => {
        if (typeof value === 'string' && value.length < 3) {
          return 'must be at least 3 characters long'
        }

        return null
      }

      const customRules = {
        name: [stringValidationRule]
      }

      const result = validateInputWithRules(
        { name: 'ab' },
        customRules
      )

      expect(result).toBe('name: must be at least 3 characters long')
    })

    test('should return null when all validators pass', () => {
      const stringValidationRule: ValidationRule<unknown> = (value: unknown) => {
        if (typeof value === 'string' && value.length < 3) {
          return 'must be at least 3 characters long'
        }

        return null
      }

      const customRules = {
        name: [stringValidationRule]
      }

      const result = validateInputWithRules(
        { name: 'valid name' },
        customRules
      )

      expect(result).toBeNull()
    })

    test('should handle non-Error exceptions with unknown error message', () => {
      const throwingValidator: ValidationRule<unknown> = () => {

        throw 'not an Error object'
      }

      const customRules = {
        field: [throwingValidator]
      }

      const result = validateInputWithRules(
        { field: 'value' },
        customRules
      )

      expect(result).toBe('An unknown error occurred')
    })

    test('should process all validators for a field in order', () => {
      const firstValidator: ValidationRule<unknown> = (value: unknown) => {
        if (typeof value === 'number' && value < 0) {
          return 'must be positive'
        }

        return null
      }

      const secondValidator: ValidationRule<unknown> = (value: unknown) => {
        if (typeof value === 'number' && value > 100) {
          return 'must be less than 100'
        }

        return null
      }

      const customRules = {
        score: [firstValidator, secondValidator]
      }

      const result = validateInputWithRules(
        { score: 150 },
        customRules
      )

      expect(result).toBe('score: must be less than 100')
    })

    test('should return first validation error encountered', () => {
      const firstValidator: ValidationRule<unknown> = (value: unknown) => {
        if (typeof value === 'number' && value < 0) {
          return 'must be positive'
        }

        return null
      }

      const secondValidator: ValidationRule<unknown> = () => 'second error'

      const customRules = {
        score: [firstValidator, secondValidator]
      }

      const result = validateInputWithRules(
        { score: -5 },
        customRules
      )

      expect(result).toBe('score: must be positive')
    })
  })
})
