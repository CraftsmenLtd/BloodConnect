import type { DTO, HasIdentifier } from './DTOCommon'

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type UrgencyType = 'regular' | 'urgent'

export enum DonationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  MANAGED = 'MANAGED',
  EXPIRED = 'EXPIRED',
}

export enum UrgencyLevel {
  REGULAR = 'regular',
  URGENT = 'urgent',
}

export type DonationDTO = DTO & {
  requestPostId: string;
  seekerId: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: 'regular' | 'urgent';
  countryCode: string;
  location: string;
  latitude: number;
  longitude: number;
  geohash: string;
  donationDateTime: string;
  status: DonationStatus;
  contactNumber: string;
  patientName?: string;
  seekerName?: string;
  transportationInfo?: string;
  shortDescription?: string;
  createdAt: string;
}

export enum DonorSearchStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export type EligibleDonorInfo = {
  distance: number;
  locationId: string;
}

export type DonorSearchDTO = DTO & {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  status: DonorSearchStatus;
  notifiedEligibleDonors: Record<string, EligibleDonorInfo>;
}

export enum AcceptDonationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  IGNORED = 'IGNORED'
}

type BaseAcceptDonationDTO = {
  donorId: string;
  requestPostId: string;
  acceptanceTime?: string;
  status: AcceptDonationStatus;
  seekerId: string;
  createdAt: string;
}

export type AcceptDonationDTO = BaseAcceptDonationDTO & DTO & {
  status?: string;
}

export type DonationRecordDTO = DTO & HasIdentifier & {
  donorId: string;
  seekerId: string;
  requestPostId: string;
  requestCreatedAt: string;
  requestedBloodGroup: BloodGroup;
  location: string;
  donationDateTime: string;
  createdAt?: string;
}
