import { getBloodRequestMessage } from '../../bloodDonationWorkflow/BloodDonationMessages'
import { UrgencyLevel } from '../../../../commons/dto/DonationDTO'

describe('BloodDonationMessages', () => {
  describe('getBloodRequestMessage', () => {
    it('should return urgent message with blood group and description', () => {
      const result = getBloodRequestMessage(
        UrgencyLevel.URGENT,
        'A+',
        'Patient in critical condition'
      )

      expect(result).toBe('Urgent A+ blood needed | Patient in critical condition')
    })

    it('should return urgent message with blood group without description', () => {
      const result = getBloodRequestMessage(UrgencyLevel.URGENT, 'B+', undefined)

      expect(result).toBe('Urgent B+ blood needed')
    })

    it('should return regular message with blood group and description', () => {
      const result = getBloodRequestMessage(
        UrgencyLevel.REGULAR,
        'O-',
        'Surgery scheduled next week'
      )

      expect(result).toBe('O- blood needed | Surgery scheduled next week')
    })

    it('should return regular message with blood group without description', () => {
      const result = getBloodRequestMessage(UrgencyLevel.REGULAR, 'AB+', undefined)

      expect(result).toBe('AB+ blood needed')
    })

    it('should handle all blood types correctly', () => {
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

      bloodTypes.forEach((bloodType) => {
        const result = getBloodRequestMessage(UrgencyLevel.REGULAR, bloodType, undefined)
        expect(result).toBe(`${bloodType} blood needed`)
      })
    })

    it('should trim whitespace from the result', () => {
      const result = getBloodRequestMessage(UrgencyLevel.REGULAR, 'A+', undefined)

      expect(result).toBe(result.trim())
      expect(result.startsWith(' ')).toBe(false)
      expect(result.endsWith(' ')).toBe(false)
    })

    it('should handle empty description string', () => {
      const result = getBloodRequestMessage(UrgencyLevel.REGULAR, 'A+', '')

      expect(result).toBe('A+ blood needed |')
    })

    it('should handle long descriptions', () => {
      const longDescription
        = 'Patient requires multiple units of blood for complex surgery. '
        + 'Family members unable to donate due to health conditions. '
        + 'Please contact hospital immediately.'

      const result = getBloodRequestMessage(UrgencyLevel.URGENT, 'A+', longDescription)

      expect(result).toBe(`Urgent A+ blood needed | ${longDescription}`)
    })

    it('should handle description with special characters', () => {
      const specialDescription = 'Patient @ City Hospital, Room #305 - ICU (24/7)'

      const result = getBloodRequestMessage(UrgencyLevel.URGENT, 'O+', specialDescription)

      expect(result).toBe(`Urgent O+ blood needed | ${specialDescription}`)
    })

    it('should handle non-standard urgency levels as regular', () => {
      const result = getBloodRequestMessage('normal', 'A+', 'Test description')

      expect(result).toBe('A+ blood needed | Test description')
    })

    it('should handle case sensitivity for urgency level', () => {
      const upperCaseResult = getBloodRequestMessage('URGENT', 'A+', undefined)
      const lowerCaseResult = getBloodRequestMessage(UrgencyLevel.URGENT, 'A+', undefined)

      // Only exact match with UrgencyLevel.URGENT ('urgent') should add 'Urgent ' prefix
      expect(upperCaseResult).toBe('A+ blood needed')
      expect(lowerCaseResult).toBe('Urgent A+ blood needed')
    })

    it('should format message consistently for urgent requests', () => {
      const withDescription = getBloodRequestMessage(
        UrgencyLevel.URGENT,
        'A+',
        'Emergency surgery'
      )
      const withoutDescription = getBloodRequestMessage(UrgencyLevel.URGENT, 'A+', undefined)

      expect(withDescription).toContain('Urgent A+ blood needed')
      expect(withoutDescription).toContain('Urgent A+ blood needed')
      expect(withDescription).toContain(' | ')
      expect(withoutDescription).not.toContain(' | ')
    })

    it('should handle description with only whitespace', () => {
      const result = getBloodRequestMessage(UrgencyLevel.REGULAR, 'A+', '   ')

      expect(result).toBe('A+ blood needed |')
    })

    it('should handle description with newlines and tabs', () => {
      const description = 'Line 1\nLine 2\tTabbed'

      const result = getBloodRequestMessage(UrgencyLevel.URGENT, 'B-', description)

      expect(result).toBe('Urgent B- blood needed | Line 1\nLine 2\tTabbed')
    })

    it('should handle description with pipe character', () => {
      const description = 'Contact: John | Jane'

      const result = getBloodRequestMessage(UrgencyLevel.REGULAR, 'O+', description)

      expect(result).toBe('O+ blood needed | Contact: John | Jane')
    })
  })
})
