import { BloodDonationAttributes, DonorRoutingAttributes } from '../../bloodDonationWorkflow/Types'
import { DonationFields, BLOOD_REQUEST_PK_PREFIX, BLOOD_REQUEST_LSISK_PREFIX } from '../../technicalImpl/dbModels/BloodDonationModel'
import { DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'

export const donationAttributesMock: BloodDonationAttributes = {
  seekerId: 'lkjhasdfka-qrwerie-sfsdl6usdf',
  patientName: 'John Doe',
  neededBloodGroup: 'O-',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  location: 'Baridhara, Dhaka',
  latitude: 23.7936,
  longitude: 90.4043,
  donationDateTime: '2023-09-20T15:00:00Z',
  contactInfo: {
    name: 'Jane Doe',
    phone: '+880123456789'
  },
  transportationInfo: 'Car available',
  shortDescription: 'Need blood urgently for surgery.'
}

export const donationDtoMock: DonationDTO = {
  id: 'req123',
  seekerId: 'user456',
  neededBloodGroup: 'A+',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  location: 'New York',
  latitude: 40.7128,
  longitude: -74.0060,
  geohash: 'dr5regw3',
  donationDateTime: '2024-10-10T00:00:00Z',
  status: DonationStatus.PENDING,
  contactInfo: {
    name: 'John Doe',
    phone: '123456789'
  }
}

export const donationFieldsMock: DonationFields = {
  PK: `${BLOOD_REQUEST_PK_PREFIX}#user456`,
  SK: `${BLOOD_REQUEST_PK_PREFIX}#req123`,
  LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#req123`,
  neededBloodGroup: 'A+',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  location: 'New York',
  latitude: 40.7128,
  longitude: -74.0060,
  geohash: 'dr5regw3',
  donationDateTime: '2024-10-10T00:00:00Z',
  status: DonationStatus.PENDING,
  contactInfo: {
    name: 'John Doe',
    phone: '123456789'
  },
  createdAt: '2024-10-10T00:00:00Z'
}

export const donorRoutingAttributesMock: DonorRoutingAttributes = {
  seekerId: 'seeker123',
  requestPostId: 'req123'
}
