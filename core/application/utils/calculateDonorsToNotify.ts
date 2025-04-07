import type { UrgencyType } from 'commons/dto/DonationDTO'

type TimeUnit = 'minutes' | 'hours'
type DelayRange = { min: number; max: number }
type TimeUnitDelays = Record<TimeUnit, DelayRange>
type DelayPeriodConfig = Record<UrgencyType, TimeUnitDelays>

const DELAY_PERIOD: DelayPeriodConfig = {
  urgent: {
    minutes: {
      min: 5,
      max: 7
    },
    hours: {
      min: 0.6,
      max: 1
    }
  },
  regular: {
    minutes: {
      min: 7,
      max: 15
    },
    hours: {
      min: 1,
      max: 2
    }
  }
}

const DELAY_WEIGHT: Record<UrgencyType, Record<TimeUnit, number>> = {
  urgent: { minutes: 0.5, hours: 0.1 },
  regular: { minutes: 1, hours: 0.2 }
}

const EXTRA_DONORS_TO_NOTIFY: Record<UrgencyType, number> = { urgent: 2, regular: 1 }

export function calculateRemainingBagsNeeded(
  bloodQuantity: number,
  donorsFoundCount: number
): number {
  return Math.max(0, bloodQuantity - donorsFoundCount)
}

export function calculateTotalDonorsToFind(
  remainingBagsNeeded: number,
  rejectedDonorsCount: number,
  urgencyLevel: UrgencyType
): number {
  return remainingBagsNeeded === 0 ? 0 : remainingBagsNeeded + rejectedDonorsCount + EXTRA_DONORS_TO_NOTIFY[urgencyLevel]
}

export function calculateDelayPeriod(
  remainingBagsNeeded: number,
  donationDateTime: string,
  urgencyLevel: UrgencyType,
  isReinstatedRetry: boolean = false
): number {
  const donationDate = new Date(donationDateTime)
  const currentDate = new Date()
  const hoursUntilDonation = Math.max(
    0,
    (donationDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60)
  )
  const minDelay: number = isReinstatedRetry
    ? DELAY_PERIOD[urgencyLevel].hours.min
    : DELAY_PERIOD[urgencyLevel].minutes.min
  const maxDelay: number = isReinstatedRetry
    ? DELAY_PERIOD[urgencyLevel].hours.max
    : DELAY_PERIOD[urgencyLevel].minutes.max

  const weight = DELAY_WEIGHT[urgencyLevel][isReinstatedRetry ? 'hours' : 'minutes']

  const delayPeriod = (hoursUntilDonation * weight) / remainingBagsNeeded
  const boundedDelay = Math.min(Math.max(minDelay, delayPeriod), maxDelay)
  return Math.round(boundedDelay * (isReinstatedRetry ? 3600 : 60))
}
