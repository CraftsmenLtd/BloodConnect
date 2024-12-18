import { DonationDTO } from '../../../../commons/dto/DonationDTO'

export type StatusType = 'ACCEPTED' | 'IGNORE' | 'PENDING'

export const STATUS: Record<string, StatusType> = {
  ACCEPTED: 'ACCEPTED',
  IGNORE: 'IGNORE',
  PENDING: 'PENDING'
}

export type DonationScreenParams = Pick<
DonationDTO,
| 'patientName'
| 'requestedBloodGroup'
| 'location'
| 'donationDateTime'
| 'contactNumber'
| 'transportationInfo'
| 'shortDescription'
| 'city'
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
