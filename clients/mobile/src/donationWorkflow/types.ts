import { DonationDTO } from '../../../../commons/dto/DonationDTO'

export type DonationScreenParams = Pick<
DonationDTO,
| 'patientName'
| 'neededBloodGroup'
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
