import { UrgencyType } from 'commons/dto/DonationDTO'

const MIN_DELAY_HOURS = 0.5
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

export function calculateTotalExecutionPerInitiation(
  maxGeohashNeighborSearchLevel: number,
  maxGeohashesPerExecution: number
): number {
  return (1 + 8 * ((maxGeohashNeighborSearchLevel - 1) * maxGeohashNeighborSearchLevel) / 2) / maxGeohashesPerExecution
}

export function calculateDelayPeriod(
  donationDateTime: string,
  maxGeohashNeighborSearchLevel: number,
  maxGeohashesPerExecution: number,
  maxInitiatingRetryCount: number,
  delayBetweenExecution: number
): number {
  const donationDate = new Date(donationDateTime)
  const currentDate = new Date()
  const totalTimeAvailableInSeconds = Math.max(0, (donationDate.getTime() - currentDate.getTime()) / 1000)

  const totalExecutionPerInitiation = calculateTotalExecutionPerInitiation(
    maxGeohashNeighborSearchLevel,
    maxGeohashesPerExecution
  )

  const delayPeriodInSeconds = (totalTimeAvailableInSeconds / maxInitiatingRetryCount) -
    (totalExecutionPerInitiation * delayBetweenExecution)

  const boundedDelayHours = Math.max(MIN_DELAY_HOURS, delayPeriodInSeconds / 3600)

  return Math.round(boundedDelayHours * 3600)
}
