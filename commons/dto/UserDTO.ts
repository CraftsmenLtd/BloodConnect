import { BloodGroup } from './DonationDTO'
import { DTO, HasIdentifier } from './DTOCommon'

export type UserDTO = DTO & HasIdentifier & {
  email: string;
  name: string;
  phone: string;
}

export type Gender = 'male' | 'female' | 'other'
export type availableForDonation = 'yes' | 'no'
export interface LocationDTO {
  userId: string;
  locationId: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  geohash: string;
  createdAt: string;
  bloodGroup: BloodGroup;
  availableForDonation: availableForDonation;
  lastVaccinatedDate: string;
}

export interface UserDetailsDTO extends UserDTO {
  phoneNumbers: string[];
  bloodGroup: BloodGroup;
  lastDonationDate: string;
  height: number;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  availableForDonation: availableForDonation;
  NIDFront: string;
  NIDBack: string;
  lastVaccinatedDate: string;
  createdAt: string;
  updatedAt?: string;
  deviceToken?: string;
}
