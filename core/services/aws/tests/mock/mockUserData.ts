import { UserFields } from "../../commons/ddbModels/UserModel";

export const expectedUser: UserFields = {
  PK: 'USER#12345',
  SK: 'PROFILE',
  email: 'ebrahim@example.com',
  name: 'Ebrahim',
  phoneNumbers: ['+8801834567890', '+8801755567822'],
  createdAt: '2023-09-16T12:00:00.000Z',
  bloodGroup: 'O-',
  lastDonationDate: '2023-09-15T14:30:00Z',
  age: 30,
  height: '5.10',
  weight: 70,
  gender: 'male',
  dateOfBirth: '1990-05-15',
  availableForDonation: true,
  NIDFront: 's3://bucket/nid/1a2b3c4d5e-front.jpg',
  NIDBack: 's3://bucket/nid/1a2b3c4d5e-back.jpg',
  lastVaccinatedDate: '2023-03-01T10:00:00Z',
  countryCode: 'BD'
}
