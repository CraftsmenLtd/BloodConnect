import { UrgencyLevel } from '@commons/dto/DonationDTO'

interface CalculationInput {
  bloodQuantity: number;
  donorsFoundCount: number;
  urgencyLevel: UrgencyLevel;
  donationDateTime: string;
}

interface CalculationResult {
  remainingBagsNeeded: number;
  totalDonorsToNotify: number;
  delayPeriod: number;
}

const URGENCY_MULTIPLIER: Record<UrgencyLevel, number> = { urgent: 2, regular: 1 }
const MIN_DELAY_PERIOD: Record<UrgencyLevel, number> = { urgent: 5, regular: 7 }
const MAX_DELAY_PERIOD: Record<UrgencyLevel, number> = { urgent: 10, regular: 15 }
const DONORS_PER_BAG_MULTIPLIER = 2
const DELAY_PERIOD_WEIGHT = 7

export function calculateRemainingBagsNeeded(bloodQuantity: number, donorsFoundCount: number): number {
  return Math.max(0, bloodQuantity - donorsFoundCount)
}

export function calculateTotalDonorsToNotify(remainingBagsNeeded: number, urgencyLevel: UrgencyLevel): number {
  const urgencyMultiplier = URGENCY_MULTIPLIER[urgencyLevel]
  return remainingBagsNeeded * urgencyMultiplier * DONORS_PER_BAG_MULTIPLIER
}

export function calculateDelayPeriod(
  remainingBagsNeeded: number,
  daysUntilDonation: number,
  urgencyLevel: UrgencyLevel
): number {
  const minDelay = MIN_DELAY_PERIOD[urgencyLevel]
  const maxDelay = MAX_DELAY_PERIOD[urgencyLevel]

  const delayPeriod = (daysUntilDonation * DELAY_PERIOD_WEIGHT / remainingBagsNeeded)
  return Math.round(Math.min(Math.max(minDelay, delayPeriod), maxDelay))
}

async function calculateDonorsToNotify(event: CalculationInput): Promise<CalculationResult> {
  const { bloodQuantity, donorsFoundCount, urgencyLevel, donationDateTime } = event

  const remainingBagsNeeded = calculateRemainingBagsNeeded(bloodQuantity, donorsFoundCount)
  const totalDonorsToNotify = calculateTotalDonorsToNotify(remainingBagsNeeded, urgencyLevel)

  const donationDate = new Date(donationDateTime)
  const currentDate = new Date()
  const daysUntilDonation = Math.max(0, (donationDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
  const delayPeriod = calculateDelayPeriod(remainingBagsNeeded, daysUntilDonation, urgencyLevel)

  return {
    remainingBagsNeeded,
    totalDonorsToNotify,
    delayPeriod
  }
}

export default calculateDonorsToNotify
