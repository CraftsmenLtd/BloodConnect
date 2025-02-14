import { UrgencyLevel } from '../../../commons/dto/DonationDTO'

export function getBloodRequestMessage(
  urgencyLevel: string,
  bloodGroup: string,
  shortDescription: string | undefined
): string {
  const description = shortDescription !== undefined ? `| ${shortDescription}` : ''
  if (urgencyLevel === UrgencyLevel.URGENT) {
    return `Urgent ${bloodGroup} blood needed ${description}`.trim()
  }

  return `${bloodGroup} blood needed ${description}`.trim()
}
