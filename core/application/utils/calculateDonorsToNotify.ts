import { UrgencyType } from '../../../commons/dto/DonationDTO'

const EXTRA_DONORS_TO_NOTIFY: Record<UrgencyType, number> = { urgent: 1, regular: 1 }
const MIN_DELAY_PERIOD: Record<UrgencyType, { minutes: number; hours: number }> = {
  urgent: { minutes: 5, hours: 1 },
  regular: { minutes: 7, hours: 1.2 }
}

const MAX_DELAY_PERIOD: Record<UrgencyType, { minutes: number; hours: number }> = {
  urgent: { minutes: 10, hours: 1.5 },
  regular: { minutes: 15, hours: 4 }
}

const DELAY_WEIGHT = {
  urgent: { minutes: 1, hours: 0.1 },
  regular: { minutes: 1.5, hours: 0.2 }
}

export function calculateRemainingBagsNeeded(
  bloodQuantity: number,
  donorsFoundCount: number
): number {
  return Math.max(0, bloodQuantity - donorsFoundCount)
}

export function calculateTotalDonorsToNotify(
  remainingBagsNeeded: number,
  urgencyLevel: UrgencyType
): number {
  return remainingBagsNeeded === 0 ? 0 : remainingBagsNeeded + EXTRA_DONORS_TO_NOTIFY[urgencyLevel]
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

  const minDelay = isReinstatedRetry
    ? MIN_DELAY_PERIOD[urgencyLevel].hours
    : MIN_DELAY_PERIOD[urgencyLevel].minutes

  const maxDelay = isReinstatedRetry
    ? MAX_DELAY_PERIOD[urgencyLevel].hours
    : MAX_DELAY_PERIOD[urgencyLevel].minutes

  const weight = DELAY_WEIGHT[urgencyLevel][isReinstatedRetry ? 'hours' : 'minutes']

  const delayPeriod = (hoursUntilDonation * weight) / remainingBagsNeeded
  const boundedDelay = Math.min(Math.max(minDelay, delayPeriod), maxDelay)
  return Math.round(boundedDelay * (isReinstatedRetry ? 3600 : 60))
}
