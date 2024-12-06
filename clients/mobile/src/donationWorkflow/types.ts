import { DonationDTO } from '../../../../commons/dto/DonationDTO'

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
> & {
  requestPostId: string;
  bloodQuantity: string;
  urgencyLevel: string;
  acceptedDonors: Array<{ donorId: string; name: string; requestPostId: string }>;
}

export type BloodDonationRecord = Omit<DonationScreenParams, 'requestPostId'> &
Pick<DonationDTO, 'latitude' | 'longitude'> & {
  reqPostId: string;
  createdAt: string;
}

export const UrgencyLevel = {
  REGULAR: 'regular',
  URGENT: 'urgent'
}
