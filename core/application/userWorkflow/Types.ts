import type { Gender, LocationDTO } from '../../../commons/dto/UserDTO'
import type { BloodGroup } from '../../../commons/dto/DonationDTO'

export type UserAttributes = {
  email: string;
  name: string;
  phoneNumbers: string[];
}

export type BaseUserAttributes = {
  userId: string;
  bloodGroup: BloodGroup;
  phoneNumbers: string[];
  height: string;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  preferredDonationLocations: LocationDTO[];
  availableForDonation: boolean;
  NIDFront?: string;
  NIDBack?: string;
}

export type CreateUserAttributes = {
  countryCode: string;
  lastDonationDate?: string;
  lastVaccinatedDate?: string;
} & BaseUserAttributes

export type UpdateUserAttributes = {
  userId: string;
  lastDonationDate?: string;
  lastVaccinatedDate?: string;
} & BaseUserAttributes
