import { validateDonationDateTime, validateBloodQuantity, validateInputWithRules, ValidationRule } from '../../utils/validator'

describe('Validation Functions', () => {
  describe('validateDonationDateTime', () => {
    it('should pass when the donationDateTime is in the future', () => {
      const futureDate = new Date(Date.now() + 10000).toISOString()
      expect(() => validateDonationDateTime(futureDate)).not.toThrow()
    })

    it('should throw an error if donationDateTime is in the past', () => {
      const pastDate = new Date(Date.now() - 10000).toISOString()
      expect(() => validateDonationDateTime(pastDate)).toThrow('donationDateTime cannot be in the past.')
    })
  })

  describe('validateBloodQuantity', () => {
    it('should pass when the bloodQuantity is between 1 and 10', () => {
      expect(() => validateBloodQuantity(5)).not.toThrow()
    })

    it('should throw an error when bloodQuantity is less than 1', () => {
      expect(() => validateBloodQuantity(0)).toThrow('bloodQuantity must be between 1 and 10.')
    })

    it('should throw an error when bloodQuantity is greater than 10', () => {
      expect(() => validateBloodQuantity(11)).toThrow('bloodQuantity must be between 1 and 10.')
    })
  })

  describe('validateInputWithRules', () => {
    const mockValidationRules = {
      bloodQuantity: [validateBloodQuantity as ValidationRule<unknown>],
      donationDateTime: [validateDonationDateTime as ValidationRule<unknown>]
    }

    it('should return null for valid inputs', () => {
      const result = validateInputWithRules(
        { bloodQuantity: 5, donationDateTime: new Date(Date.now() + 3600000).toISOString() },
        mockValidationRules
      )

      expect(result).toBeNull()
    })

    it('should return an error message for invalid blood quantity', () => {
      const result = validateInputWithRules(
        { bloodQuantity: 11, donationDateTime: new Date().toISOString() },
        mockValidationRules
      )

      expect(result).toBe('bloodQuantity: bloodQuantity must be between 1 and 10.')
    })

    it('should return an error message for invalid donation date time', () => {
      const pastDate = new Date(Date.now() - 10000).toISOString()
      const result = validateInputWithRules(
        { bloodQuantity: 5, donationDateTime: pastDate },
        mockValidationRules
      )

      expect(result).toBe('donationDateTime: donationDateTime cannot be in the past.')
    })
  })
})
