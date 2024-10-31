import { DTO, HasIdentifier } from './DTOCommon'

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type UrgencyLevel = 'regular' | 'urgent'

export enum DonationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

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
  status: DonationStatus;
  contactNumber: string;
  patientName?: string;
  transportationInfo?: string;
  shortDescription?: string;
  retryCount?: number;
}

export interface StepFunctionInput extends DTO {
  seekerId: string;
  requestPostId: string;
  additionalParams?: Record<string, any>;
}
