import { BloodGroup } from './DonationDTO'
import { DTO, HasIdentifier } from './DTOCommon'

export type UserDTO = DTO & HasIdentifier & {
  email: string;
  name: string;
  phoneNumbers: string[];
}

export type Gender = 'male' | 'female' | 'other'
export type AvailableForDonation = 'yes' | 'no'

export interface UserDetailsDTO extends UserDTO {
  bloodGroup: BloodGroup;
  lastDonationDate?: string;
  height: number;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  city: string;
  availableForDonation: AvailableForDonation;
  NIDFront: string;
  NIDBack: string;
  lastVaccinatedDate?: string;
  createdAt: string;
  updatedAt?: string;
  deviceToken?: string;
  snsEndpointArn?: string;
}

export interface UserResponseData {
  success: boolean;
  data: {
    preferredDonationLocations: Array<Omit<LocationDTO, 'userId' | 'locationId' | 'geohash' | 'createdAt'>>;
    message: string;
  } & Omit<UserDetailsDTO, 'email' | 'age' | 'createdAt' | 'updatedAt' | 'deviceToken' | 'snsEndpointArn'>;
}

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
  availableForDonation: AvailableForDonation;
  lastVaccinatedDate: string;
}
