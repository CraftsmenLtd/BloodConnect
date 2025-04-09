import type { BloodGroup } from './DonationDTO'
import type { DTO, HasIdentifier } from './DTOCommon'

export type UserDTO = DTO & HasIdentifier & {
  email: string;
  name: string;
  phoneNumbers: string[];
}

export type Gender = 'male' | 'female' | 'other'

export type UserDetailsDTO = {
  bloodGroup: BloodGroup;
  lastDonationDate?: string;
  height: string;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  countryCode: string;
  availableForDonation: boolean;
  NIDFront: string;
  NIDBack: string;
  lastVaccinatedDate?: string;
  createdAt: string;
  updatedAt?: string;
  deviceToken?: string;
  snsEndpointArn?: string;
} & UserDTO

export type LocationDTO = {
  userId: string;
  locationId: string;
  area: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  geohash: string;
  createdAt: string;
  bloodGroup: BloodGroup;
  availableForDonation: boolean;
  lastVaccinatedDate: string;
}
