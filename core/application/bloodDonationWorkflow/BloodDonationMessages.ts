import { UrgencyLevel } from '../../../commons/dto/DonationDTO'

export function getBloodRequestMessage(
  urgencyLevel: string,
  bloodGroup: string,
  shortDescription: string | undefined
): string {
  const urgent = urgencyLevel === UrgencyLevel.URGENT ? 'Urgent ' : ''
  const description = shortDescription !== undefined ? `| ${shortDescription}` : ''
  return `${urgent}${bloodGroup} blood needed ${description}`.trim()
}
