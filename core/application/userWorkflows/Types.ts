import { Gender, LocationDTO, availableForDonation } from '../../../commons/dto/UserDTO'
import { BloodGroup } from '../../../commons/dto/DonationDTO'

export type UserAttributes = {
  email: string;
  name: string;
  phone_number: string;
}

export interface UpdateUserAttributes {
  userId: string;
  phoneNumbers: string[];
  name: string;
  bloodGroup: BloodGroup;
  lastDonationDate: string;
  height: number;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  preferredDonationLocations: LocationDTO[];
  availableForDonation: availableForDonation;
  NIDFront: string;
  NIDBack: string;
  lastVaccinatedDate: string;
}
