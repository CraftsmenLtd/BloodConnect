import {
  BloodDonationAttributes
} from '../../bloodDonationWorkflow/Types'
import {
  DonationFields,
  BLOOD_REQUEST_PK_PREFIX,
  BLOOD_REQUEST_LSI1SK_PREFIX
} from '../../models/dbModels/BloodDonationModel'
import {
  BloodGroup,
  DonationDTO,
  DonationStatus
} from '../../../../commons/dto/DonationDTO'

export const currentDate = new Date().toISOString()

export const donationAttributesMock: BloodDonationAttributes = {
  seekerId: 'lkjhasdfka-qrwerie-sfsdl6usdf',
  patientName: 'John Doe',
  requestedBloodGroup: 'O-',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  countryCode: 'BD',
  location: 'Baridhara, Dhaka',
  latitude: 23.7936,
  longitude: 90.4043,
  donationDateTime: '2024-12-20T15:00:00Z',
  contactNumber: '123456789',
  transportationInfo: 'Car available',
  shortDescription: 'Need blood urgently for surgery.'
}

export const donationDtoMock: DonationDTO = {
  requestPostId: 'req123',
  seekerId: 'user456',
  requestedBloodGroup: 'A+',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  countryCode: 'BD',
  location: 'New York',
  latitude: 40.7128,
  longitude: -74.006,
  geohash: 'dr5regw3',
  donationDateTime: '2024-10-10T00:00:00Z',
  status: DonationStatus.PENDING,
  contactNumber: '123456789',
  createdAt: currentDate
}

export const donationFieldsMock: DonationFields = {
  PK: `${BLOOD_REQUEST_PK_PREFIX}#user456`,
  SK: `${BLOOD_REQUEST_PK_PREFIX}#${currentDate}#req123`,
  GSI1PK: `LOCATION#BD-dr5r#STATUS#${DonationStatus.PENDING}`,
  GSI1SK: `${currentDate}#BG#A+`,
  LSI1SK: `${BLOOD_REQUEST_LSI1SK_PREFIX}#${DonationStatus.PENDING}#req123`,
  requestedBloodGroup: 'A+',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  countryCode: 'BD',
  location: 'New York',
  latitude: 40.7128,
  longitude: -74.006,
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

export const mockDonationDTO: DonationDTO = {
  requestPostId: 'req123',
  seekerId: 'seeker123',
  status: DonationStatus.PENDING,
  patientName: 'John Doe',
  requestedBloodGroup: 'O-' as BloodGroup,
  bloodQuantity: 2,
  urgencyLevel: 'urgent' as const,
  countryCode: 'BD',
  location: 'Baridhara, Dhaka',
  geohash: 'geohash123',
  donationDateTime: '2024-10-20T15:00:00Z',
  latitude: 23.7808875,
  longitude: 90.2792371,
  contactNumber: '01712345678',
  createdAt: currentDate
}
