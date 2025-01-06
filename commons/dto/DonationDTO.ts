import { DTO, HasIdentifier } from './DTOCommon'

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
  city: string;
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

export type DonorSearchDTO = DTO & {
  requestPostId: string;
  seekerId: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  city: string;
  location: string;
  geohash: string;
  donationDateTime: string;
  status: DonationStatus;
  contactNumber: string;
  patientName?: string;
  transportationInfo?: string;
  shortDescription?: string;
  createdAt: string;
  retryCount: number;
  currentNeighborSearchLevel?: number;
  remainingGeohashesToProcess?: string[];
}

export enum AcceptDonationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  IGNORED = 'IGNORED'
}

type BaseAcceptedDonationDTO = {
  donorId: string;
  requestPostId: string;
  acceptanceTime?: string;
  status: AcceptDonationStatus;
  seekerId: string;
  createdAt: string;
}

export type AcceptedDonationDTO = BaseAcceptedDonationDTO & DTO & {
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
