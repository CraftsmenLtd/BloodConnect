import {
  calculateRemainingBagsNeeded,
  calculateTotalDonorsToFind,
  calculateTotalExecutionPerInitiation,
  calculateDelayPeriod
} from '../../utils/calculateDonorsToNotify'

describe('calculateDonorsToNotify utility functions', () => {
  describe('calculateRemainingBagsNeeded', () => {
    test('should return correct remaining bags when donors found is less than blood quantity', () => {
      const result = calculateRemainingBagsNeeded(5, 2)
      expect(result).toBe(3)
    })

    test('should return 0 when donors found equals blood quantity', () => {
      const result = calculateRemainingBagsNeeded(5, 5)
      expect(result).toBe(0)
    })

    test('should return 0 when donors found exceeds blood quantity', () => {
      const result = calculateRemainingBagsNeeded(5, 7)
      expect(result).toBe(0)
    })

    test('should handle blood quantity of 1', () => {
      const result = calculateRemainingBagsNeeded(1, 0)
      expect(result).toBe(1)
    })

    test('should handle large numbers', () => {
      const result = calculateRemainingBagsNeeded(100, 30)
      expect(result).toBe(70)
    })

    test('should return 0 when blood quantity is 0', () => {
      const result = calculateRemainingBagsNeeded(0, 0)
      expect(result).toBe(0)
    })

    test('should handle when no donors found yet', () => {
      const result = calculateRemainingBagsNeeded(10, 0)
      expect(result).toBe(10)
    })

    test('should return 0 when donors found greatly exceeds blood quantity', () => {
      const result = calculateRemainingBagsNeeded(5, 50)
      expect(result).toBe(0)
    })
  })

  describe('calculateTotalDonorsToFind', () => {
    test('should add 2 extra donors for urgent requests', () => {
      const result = calculateTotalDonorsToFind(5, 'urgent')
      expect(result).toBe(7)
    })

    test('should add 1 extra donor for regular requests', () => {
      const result = calculateTotalDonorsToFind(5, 'regular')
      expect(result).toBe(6)
    })

    test('should return 0 when remaining bags needed is 0 for urgent', () => {
      const result = calculateTotalDonorsToFind(0, 'urgent')
      expect(result).toBe(0)
    })

    test('should return 0 when remaining bags needed is 0 for regular', () => {
      const result = calculateTotalDonorsToFind(0, 'regular')
      expect(result).toBe(0)
    })

    test('should handle 1 bag needed for urgent requests', () => {
      const result = calculateTotalDonorsToFind(1, 'urgent')
      expect(result).toBe(3)
    })

    test('should handle 1 bag needed for regular requests', () => {
      const result = calculateTotalDonorsToFind(1, 'regular')
      expect(result).toBe(2)
    })

    test('should handle large numbers for urgent requests', () => {
      const result = calculateTotalDonorsToFind(100, 'urgent')
      expect(result).toBe(102)
    })

    test('should handle large numbers for regular requests', () => {
      const result = calculateTotalDonorsToFind(100, 'regular')
      expect(result).toBe(101)
    })
  })

  describe('calculateTotalExecutionPerInitiation', () => {
    test('should calculate correct total for level 3 and 50 geohashes per execution', () => {
      // Formula: (1 + 8 * ((3 - 1) * 3) / 2) / 50
      // = (1 + 8 * (2 * 3) / 2) / 50
      // = (1 + 8 * 3) / 50
      // = 25 / 50
      // = 0.5
      const result = calculateTotalExecutionPerInitiation(3, 50)
      expect(result).toBe(0.5)
    })

    test('should calculate correct total for level 2 and 10 geohashes', () => {
      // Formula: (1 + 8 * ((2 - 1) * 2) / 2) / 10
      // = (1 + 8 * 1) / 10
      // = 9 / 10
      // = 0.9
      const result = calculateTotalExecutionPerInitiation(2, 10)
      expect(result).toBe(0.9)
    })

    test('should calculate correct total for level 1 and 100 geohashes', () => {
      // Formula: (1 + 8 * ((1 - 1) * 1) / 2) / 100
      // = (1 + 0) / 100
      // = 0.01
      const result = calculateTotalExecutionPerInitiation(1, 100)
      expect(result).toBe(0.01)
    })

    test('should handle level 4 with 25 geohashes', () => {
      // Formula: (1 + 8 * ((4 - 1) * 4) / 2) / 25
      // = (1 + 8 * 6) / 25
      // = 49 / 25
      // = 1.96
      const result = calculateTotalExecutionPerInitiation(4, 25)
      expect(result).toBe(1.96)
    })

    test('should handle maxGeohashesPerExecution of 1', () => {
      // Formula: (1 + 8 * ((2 - 1) * 2) / 2) / 1
      // = (1 + 8) / 1
      // = 9
      const result = calculateTotalExecutionPerInitiation(2, 1)
      expect(result).toBe(9)
    })

    test('should handle level 5 with 100 geohashes', () => {
      // Formula: (1 + 8 * ((5 - 1) * 5) / 2) / 100
      // = (1 + 8 * 10) / 100
      // = 81 / 100
      // = 0.81
      const result = calculateTotalExecutionPerInitiation(5, 100)
      expect(result).toBe(0.81)
    })
  })

  describe('calculateDelayPeriod', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should calculate delay period for future donation time', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 10 hours
      const donationDateTime = new Date('2025-01-15T20:00:00.000Z').toISOString()

      const result = calculateDelayPeriod(
        donationDateTime,
        3, // maxGeohashNeighborSearchLevel
        50, // maxGeohashesPerExecution
        5, // maxInitiatingRetryCount
        1 // delayBetweenExecution (1 second)
      )

      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })

    test('should return minimum delay when calculated delay is less than minimum', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 10 minutes (short time)
      const donationDateTime = new Date('2025-01-15T10:10:00.000Z').toISOString()

      const result = calculateDelayPeriod(
        donationDateTime,
        3,
        50,
        5,
        1
      )

      // Should return minimum delay of 0.5 hours = 1800 seconds
      expect(result).toBe(1800)
    })

    test('should handle donation time in the past', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in the past
      const donationDateTime = new Date('2025-01-15T08:00:00.000Z').toISOString()

      const result = calculateDelayPeriod(
        donationDateTime,
        3,
        50,
        5,
        1
      )

      // Should return minimum delay
      expect(result).toBe(1800)
    })

    test('should calculate different delays for different retry counts', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 24 hours
      const donationDateTime = new Date('2025-01-16T10:00:00.000Z').toISOString()

      const result5Retries = calculateDelayPeriod(donationDateTime, 3, 50, 5, 1)
      const result10Retries = calculateDelayPeriod(donationDateTime, 3, 50, 10, 1)

      // With more retries, delay should be shorter
      expect(result10Retries).toBeLessThan(result5Retries)
    })

    test('should return rounded delay period in seconds', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 10 hours
      const donationDateTime = new Date('2025-01-15T20:00:00.000Z').toISOString()

      const result = calculateDelayPeriod(donationDateTime, 3, 50, 5, 1)

      // Result should be an integer (rounded)
      expect(Number.isInteger(result)).toBe(true)
    })

    test('should handle different delay between execution values', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 24 hours
      const donationDateTime = new Date('2025-01-16T10:00:00.000Z').toISOString()

      const result1Second = calculateDelayPeriod(donationDateTime, 3, 50, 5, 1)
      const result10Seconds = calculateDelayPeriod(donationDateTime, 3, 50, 5, 10)

      // With higher delay between executions, overall delay period should be less
      expect(result10Seconds).toBeLessThan(result1Second)
    })

    test('should handle different max neighbor search levels', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 24 hours
      const donationDateTime = new Date('2025-01-16T10:00:00.000Z').toISOString()

      const resultLevel3 = calculateDelayPeriod(donationDateTime, 3, 50, 5, 1)
      const resultLevel5 = calculateDelayPeriod(donationDateTime, 5, 50, 5, 1)

      // Both should be valid positive numbers
      expect(resultLevel3).toBeGreaterThan(0)
      expect(resultLevel5).toBeGreaterThan(0)
    })

    test('should handle different max geohashes per execution', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 24 hours
      const donationDateTime = new Date('2025-01-16T10:00:00.000Z').toISOString()

      const result50Geohashes = calculateDelayPeriod(donationDateTime, 3, 50, 5, 1)
      const result100Geohashes = calculateDelayPeriod(donationDateTime, 3, 100, 5, 1)

      // Both should be valid positive numbers
      expect(result50Geohashes).toBeGreaterThan(0)
      expect(result100Geohashes).toBeGreaterThan(0)
    })

    test('should handle exact minimum delay boundary', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Very short time period that results in exactly minimum delay
      const donationDateTime = new Date('2025-01-15T10:05:00.000Z').toISOString()

      const result = calculateDelayPeriod(donationDateTime, 3, 50, 5, 1)

      // Should be minimum delay of 1800 seconds (0.5 hours)
      expect(result).toBe(1800)
    })

    test('should handle large time periods', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 7 days
      const donationDateTime = new Date('2025-01-22T10:00:00.000Z').toISOString()

      const result = calculateDelayPeriod(donationDateTime, 3, 50, 5, 1)

      expect(result).toBeGreaterThan(1800) // Greater than minimum
      expect(Number.isInteger(result)).toBe(true)
    })

    test('should factor in total execution per initiation correctly', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 24 hours
      const donationDateTime = new Date('2025-01-16T10:00:00.000Z').toISOString()

      // The calculation should account for:
      // totalExecutionPerInitiation * delayBetweenExecution
      // being subtracted from the total delay period

      const result = calculateDelayPeriod(donationDateTime, 3, 50, 5, 1)

      // Result should be positive and reasonable
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(24 * 3600) // Less than 24 hours
    })

    test('should handle retry count of 1', () => {
      const currentDate = new Date('2025-01-15T10:00:00.000Z')
      jest.setSystemTime(currentDate)

      // Donation in 24 hours
      const donationDateTime = new Date('2025-01-16T10:00:00.000Z').toISOString()

      const result = calculateDelayPeriod(donationDateTime, 3, 50, 1, 1)

      // With only 1 retry, delay should be longer (closer to full time available)
      expect(result).toBeGreaterThan(1800)
    })
  })
})
