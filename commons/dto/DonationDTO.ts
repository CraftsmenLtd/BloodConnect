import { DTO, HasIdentifier } from './DTOCommon'

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type UrgencyLevel = 'regular' | 'urgent'

export type DonationDTO = DTO & HasIdentifier & {
  seekerId: string;
  neededBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: 'regular' | 'urgent';
  location: string;
  latitude: number;
  longitude: number;
  geohash: string;
  donationDateTime: string;
  status: 'pending' | 'accepted' | 'completed';
  contactInfo: { name: string; phone: string };
  patientName?: string;
  transportationInfo?: string;
  shortDescription?: string;
}
