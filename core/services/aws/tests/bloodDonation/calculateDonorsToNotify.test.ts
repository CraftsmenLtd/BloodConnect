import { UrgencyType } from '../../../../../commons/dto/DonationDTO'
import calculateDonorsToNotify, {
  calculateRemainingBagsNeeded,
  calculateTotalDonorsToNotify,
  calculateDelayPeriod
} from '../../donorSearch/calculateDonorsToNotify'

describe('calculateRemainingBagsNeeded', () => {
  it('should return the difference between bloodQuantity and donorsFoundCount', () => {
    expect(calculateRemainingBagsNeeded(10, 5)).toBe(5)
  })

  it('should return 0 if donorsFoundCount is greater than bloodQuantity', () => {
    expect(calculateRemainingBagsNeeded(5, 10)).toBe(0)
  })
})

describe('calculateTotalDonorsToNotify', () => {
  it('should calculate the correct total donors to notify for urgent urgency level', () => {
    expect(calculateTotalDonorsToNotify(2, 'urgent')).toBe(4)
  })

  it('should calculate the correct total donors to notify for regular urgency level', () => {
    expect(calculateTotalDonorsToNotify(2, 'regular')).toBe(3)
  })
})

describe('calculateDelayPeriod', () => {
  it('should calculate delay period within the min and max delay range for urgent urgency level', () => {
    const delay = calculateDelayPeriod(3, 2, 'urgent')
    expect(delay).toBeGreaterThanOrEqual(5)
    expect(delay).toBeLessThanOrEqual(300)
  })

  it('should calculate delay period within the min and max delay range for regular urgency level', () => {
    const delay = calculateDelayPeriod(3, 5, 'regular')
    expect(delay).toBeGreaterThanOrEqual(7)
    expect(delay).toBeLessThanOrEqual(700)
  })

  it('should calculate a higher urgencyFactor for higher daysUntilDonation', () => {
    const delayShort = calculateDelayPeriod(3, 1, 'regular')
    const delayLong = calculateDelayPeriod(3, 10, 'regular')
    expect(delayLong).toBeGreaterThan(delayShort)
  })

  it('should handle remainingBagsNeeded = 0 gracefully', () => {
    const delay = calculateDelayPeriod(0, 5, 'regular')
    expect(delay).toBe(900)
  })
})

describe('calculateDonorsToNotify', () => {
  it('should calculate the correct result for given input values', async() => {
    const input = {
      bloodQuantity: 10,
      donorsFoundCount: 4,
      urgencyLevel: 'urgent' as UrgencyType,
      donationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      retryCount: 1
    }

    const result = await calculateDonorsToNotify(input)

    expect(result.remainingBagsNeeded).toBe(6)
    expect(result.totalDonorsToNotify).toBe(8)
    expect(result.delayPeriod).toBeGreaterThanOrEqual(5)
    expect(result.delayPeriod).toBeLessThanOrEqual(300)
  })

  it('should handle cases where remainingBagsNeeded is 0', async() => {
    const input = {
      bloodQuantity: 10,
      donorsFoundCount: 10,
      urgencyLevel: 'regular' as UrgencyType,
      donationDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      retryCount: 1
    }

    const result = await calculateDonorsToNotify(input)

    expect(result.remainingBagsNeeded).toBe(0)
    expect(result.totalDonorsToNotify).toBe(0)
    expect(result.delayPeriod).toBeGreaterThanOrEqual(7)
    expect(result.delayPeriod).toBeLessThanOrEqual(900)
  })
})
