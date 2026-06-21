import type { UrgencyType } from 'commons/dto/DonationDTO'

const EXTRA_DONORS_TO_NOTIFY: Record<UrgencyType, number> = { urgent: 2, regular: 1 }

export function calculateRemainingBagsNeeded(
  bloodQuantity: number,
  donorsFoundCount: number
): number {
  return Math.max(0, bloodQuantity - donorsFoundCount)
}

export function calculateTotalDonorsToFind(
  remainingBagsNeeded: number,
  urgencyLevel: UrgencyType
): number {
  return remainingBagsNeeded === 0 ? 0 : remainingBagsNeeded + EXTRA_DONORS_TO_NOTIFY[urgencyLevel]
}

export function calculateDelayPeriod(
  donationDateTime: string,
  maxRetries: number,
  retryDelaySeconds: number,
  acceptanceWindowSeconds: number
): number {
  const donationDate = new Date(donationDateTime)
  const currentDate = new Date()
  const totalTimeAvailableInSeconds = Math.max(0, (donationDate.getTime() - currentDate.getTime()) / 1000)

  const delayPeriodInSeconds = (totalTimeAvailableInSeconds / Math.max(1, maxRetries))
    - retryDelaySeconds

  return Math.max(acceptanceWindowSeconds, Math.round(delayPeriodInSeconds))
}
