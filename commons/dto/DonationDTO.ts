import { DTO, HasIdentifier } from './DTOCommon'

export type DonationDTO = DTO & HasIdentifier & {
  bloodGroup: string;
  location: string;
  phone: string;
  donationDate: Date;
}
