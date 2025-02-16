import { UrgencyLevel } from '../../../commons/dto/DonationDTO'

export function getBloodRequestMessage(urgencyLevel: string, bloodGroup: string): string {
  return `${urgencyLevel === UrgencyLevel.URGENT ? "Urgent " : ""}${bloodGroup} blood needed`
}
