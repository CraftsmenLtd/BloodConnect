import { UrgencyLevel } from '../../../commons/dto/DonationDTO'

export function getBloodRequestMessage (
  urgencyLevel: string,
  bloodGroup: string,
  description: string | undefined
): string {
  return `${urgencyLevel === UrgencyLevel.URGENT ? 'Urgent ' : ''}${bloodGroup} blood needed${
    description !== undefined ? ` | ${description}` : ''
  }`.trim()
}
