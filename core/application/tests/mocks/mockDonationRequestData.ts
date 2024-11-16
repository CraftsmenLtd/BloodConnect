import { BloodDonationAttributes, DonorRoutingAttributes } from '../../bloodDonationWorkflow/Types'
import { DonationFields, BLOOD_REQUEST_PK_PREFIX, BLOOD_REQUEST_LSISK_PREFIX } from '../../Models/dbModels/BloodDonationModel'
import { BloodGroup, DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'

export const currentDate = new Date().toISOString()

export const donationAttributesMock: BloodDonationAttributes = {
  seekerId: 'lkjhasdfka-qrwerie-sfsdl6usdf',
  patientName: 'John Doe',
  neededBloodGroup: 'O-',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  city: 'Dhaka',
  location: 'Baridhara, Dhaka',
  latitude: 23.7936,
  longitude: 90.4043,
  donationDateTime: '2024-12-20T15:00:00Z',
  contactNumber: '123456789',
  transportationInfo: 'Car available',
  shortDescription: 'Need blood urgently for surgery.'
}

export const donationDtoMock: DonationDTO = {
  id: 'req123',
  seekerId: 'user456',
  neededBloodGroup: 'A+',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  city: 'Dhaka',
  location: 'New York',
  latitude: 40.7128,
  longitude: -74.0060,
  geohash: 'dr5regw3',
  donationDateTime: '2024-10-10T00:00:00Z',
  status: DonationStatus.PENDING,
  contactNumber: '123456789',
  createdAt: currentDate
}

export const donationFieldsMock: DonationFields = {
  PK: `${BLOOD_REQUEST_PK_PREFIX}#user456`,
  SK: `${BLOOD_REQUEST_PK_PREFIX}#${currentDate}#req123`,
  LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#req123`,
  neededBloodGroup: 'A+',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  city: 'Dhaka',
  location: 'New York',
  latitude: 40.7128,
  longitude: -74.0060,
  geohash: 'dr5regw3',
  donationDateTime: '2024-10-10T00:00:00Z',
  status: DonationStatus.PENDING,
  contactNumber: '123456789',
  createdAt: currentDate
}

export const mockQueryResult = {
  items: [donationDtoMock],
  lastEvaluatedKey: undefined
}

export const donorRoutingAttributesMock: DonorRoutingAttributes = {
  seekerId: 'seeker123',
  requestPostId: 'req123',
  createdAt: currentDate
}

export const mockDonationDTO: DonationDTO = {
  id: 'req123',
  seekerId: 'seeker123',
  status: DonationStatus.PENDING,
  patientName: 'John Doe',
  neededBloodGroup: 'O-' as BloodGroup,
  bloodQuantity: 2,
  urgencyLevel: 'urgent' as const,
  city: 'Dhaka',
  location: 'Baridhara, Dhaka',
  geohash: 'geohash123',
  donationDateTime: '2024-10-20T15:00:00Z',
  retryCount: 0,
  latitude: 23.7808875,
  longitude: 90.2792371,
  contactNumber: '01712345678',
  createdAt: currentDate
}
