import type { DonationDTO } from '../../../../commons/dto/DonationDTO'

export type StatusType =
  'ACCEPTED' |
  'IGNORED' |
  'PENDING' |
  'CANCELLED' |
  'EXPIRED' |
  'MANAGED' |
  'COMPLETED'

export const STATUS: Record<string, StatusType> = {
  ACCEPTED: 'ACCEPTED',
  IGNORED: 'IGNORED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  MANAGED: 'MANAGED',
  COMPLETED: 'COMPLETED'
}

export type DonationScreenParams = Pick<
DonationDTO,
| 'seekerName'
| 'patientName'
| 'requestedBloodGroup'
| 'location'
| 'donationDateTime'
| 'contactNumber'
| 'transportationInfo'
| 'shortDescription'
| 'seekerId'
> & {
  requestPostId: string;
  bloodQuantity: string;
  urgencyLevel: string;
  acceptedDonors: Array<{ donorId: string; donorName: string; requestPostId: string }>;
}

export type BloodDonationRecord = Omit<DonationScreenParams, 'requestPostId'> &
Pick<DonationDTO, 'latitude' | 'longitude'> & {
  status: StatusType;
  requestPostId: string;
  createdAt: string;
}

export const UrgencyLevel = {
  REGULAR: 'regular',
  URGENT: 'urgent'
}
