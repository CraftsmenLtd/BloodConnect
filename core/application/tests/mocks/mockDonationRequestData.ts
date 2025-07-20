import type {
  BloodDonationAttributes,
  UpdateBloodDonationAttributes
} from '../../bloodDonationWorkflow/Types'
import type {
  DonationFields } from '../../../services/aws/commons/ddbModels/BloodDonationModel'
import {
  BLOOD_REQUEST_PK_PREFIX,
  BLOOD_REQUEST_LSI1SK_PREFIX
} from '../../../services/aws/commons/ddbModels/BloodDonationModel'
import type {
  BloodGroup,
  DonationDTO } from '../../../../commons/dto/DonationDTO'
import {
  DonationStatus
} from '../../../../commons/dto/DonationDTO'

export const currentDate = new Date().toISOString()

export const donationAttributesMock: BloodDonationAttributes = {
  seekerId: 'user456',
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

export const updateDonationAttributesMock: UpdateBloodDonationAttributes = {
  seekerId: 'user456',
  patientName: 'John Doe',
  requestedBloodGroup: 'O-',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  location: 'Baridhara, Dhaka',
  latitude: 23.7936,
  longitude: 90.4043,
  donationDateTime: '2024-12-20T15:00:00Z',
  contactNumber: '123456789',
  transportationInfo: 'Car available',
  shortDescription: 'Need blood urgently for surgery.',
  requestPostId: 'req123',
  createdAt: currentDate
}

export const donationDtoMock: DonationDTO = {
  requestPostId: 'req123',
  seekerId: 'user456',
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
  shortDescription: 'Need blood urgently for surgery.',
  status: DonationStatus.PENDING,
  createdAt: currentDate,
  geohash: 'wh0r35qr'
}

export const donationFieldsMock: DonationFields = {
  PK: `${BLOOD_REQUEST_PK_PREFIX}#user456`,
  SK: `${BLOOD_REQUEST_PK_PREFIX}#${currentDate}#req123`,
  GSI1PK: `LOCATION#BD-wh0r#STATUS#${DonationStatus.PENDING}`,
  GSI1SK: `${currentDate}#BG#O-`,
  LSI1SK: `${BLOOD_REQUEST_LSI1SK_PREFIX}#${DonationStatus.PENDING}#req123`,
  requestedBloodGroup: 'O-',
  patientName: 'John Doe',
  bloodQuantity: 2,
  urgencyLevel: 'urgent',
  countryCode: 'BD',
  location: 'Baridhara, Dhaka',
  latitude: 23.7936,
  longitude: 90.4043,
  geohash: 'wh0r35qr',
  donationDateTime: '2024-12-20T15:00:00Z',
  transportationInfo: 'Car available',
  shortDescription: 'Need blood urgently for surgery.',
  contactNumber: '123456789',
  status: DonationStatus.PENDING,
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
  geohash: 'wh0r35qr',
  donationDateTime: '2024-10-20T15:00:00Z',
  latitude: 23.7808875,
  longitude: 90.2792371,
  contactNumber: '01712345678',
  createdAt: currentDate
}
