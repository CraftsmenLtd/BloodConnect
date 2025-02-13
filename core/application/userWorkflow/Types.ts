import { Gender, LocationDTO } from '../../../commons/dto/UserDTO'
import { BloodGroup } from '../../../commons/dto/DonationDTO'

export type UserAttributes = {
  email: string;
  name: string;
  phoneNumbers: string[];
}

export interface BaseUserAttributes extends UserAttributes {
  userId: string;
  bloodGroup: BloodGroup;
  height: string;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  city: string;
  preferredDonationLocations: LocationDTO[];
  availableForDonation: boolean;
  NIDFront: string;
  NIDBack: string;
}

export interface CreateUserAttributes extends BaseUserAttributes {
  lastDonationDate: string;
  lastVaccinatedDate: string;
}

export interface UpdateUserAttributes extends BaseUserAttributes {
  userId: string;
  lastDonationDate?: string;
  lastVaccinatedDate?: string;
}
