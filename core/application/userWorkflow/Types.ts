import { Gender, LocationDTO, AvailableForDonation } from '../../../commons/dto/UserDTO'
import { BloodGroup } from '../../../commons/dto/DonationDTO'

export type UserAttributes = {
  email: string;
  name: string;
  phoneNumbers: string[];
}

export interface CreateUserAttributes extends UserAttributes {
  userId: string;
  name: string;
  bloodGroup: BloodGroup;
  lastDonationDate: string;
  height: string;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  city: string;
  preferredDonationLocations: LocationDTO[];
  availableForDonation: AvailableForDonation;
  NIDFront: string;
  NIDBack: string;
  lastVaccinatedDate: string;
}

export interface UpdateUserAttributes extends UserAttributes {
  userId: string;
  name: string;
  bloodGroup: BloodGroup;
  lastDonationDate?: string;
  height: string;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  city: string;
  preferredDonationLocations: LocationDTO[];
  availableForDonation: AvailableForDonation;
  NIDFront: string;
  NIDBack: string;
  lastVaccinatedDate?: string;
}
