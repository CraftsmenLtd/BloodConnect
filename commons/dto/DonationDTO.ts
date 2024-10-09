import { DTO, HasIdentifier } from './DTOCommon'

// TODO: add all the needed fields
export type DonationDTO = DTO & HasIdentifier & {
  seekerId: string;
  bloodGroup: string;
  location: string;
  donationDateTime: Date;
}
