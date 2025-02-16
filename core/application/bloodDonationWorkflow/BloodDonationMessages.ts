import { UrgencyLevel } from '../../../commons/dto/DonationDTO'

export function getBloodRequestMessage(urgencyLevel: string, bloodGroup: string): string {
  if (urgencyLevel === UrgencyLevel.URGENT) {
    return `Urgent ${bloodGroup} blood needed`
  }

  return `${bloodGroup}`
}
