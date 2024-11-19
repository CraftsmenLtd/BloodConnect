import { BLOOD_REQUEST_MESSAGE_TEMPLATE } from '../utils/messageConstants'
import { replaceTemplatePlaceholders } from '../utils/formatString'
import { UrgencyLevel } from 'commons/dto/DonationDTO'

export function getBloodRequestMessage(urgencyLevel: string, bloodGroup: string, shortDescription: string): string {
  const urgency = urgencyLevel === UrgencyLevel.URGENT ? 'Urgent' : ''
  return replaceTemplatePlaceholders(BLOOD_REQUEST_MESSAGE_TEMPLATE, urgency, bloodGroup, shortDescription)
}
