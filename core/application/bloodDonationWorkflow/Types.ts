import { ValidationRule, validateDonationDateTime, validateBloodQuantity } from '../utils/validator'
import {
  AcceptDonationStatus,
  BloodGroup,
  DonorSearchStatus,
  EligibleDonorInfo,
  UrgencyType
} from '../../../commons/dto/DonationDTO'

export interface BloodDonationAttributes {
  seekerId: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  countryCode: string;
  city: string;
  location: string;
  latitude: number;
  longitude: number;
  donationDateTime: string;
  contactNumber: string;
  patientName?: string;
  seekerName?: string;
  transportationInfo?: string;
  shortDescription?: string;
}
type CredentialKeys = 'donationDateTime' | 'bloodQuantity'

export const validationRules: Record<CredentialKeys, Array<ValidationRule<any>>> = {
  donationDateTime: [(value: string) => validateDonationDateTime(value)],
  bloodQuantity: [(value: number) => validateBloodQuantity(value)]
}

export interface UpdateBloodDonationAttributes {
  requestPostId: string;
  seekerId: string;
  createdAt: string;
  bloodQuantity?: number;
  urgencyLevel?: UrgencyType;
  donationDateTime?: string;
  contactNumber?: string;
  patientCondition?: string;
  patientName?: string;
  transportationInfo?: string;
  shortDescription?: string;
}

export interface DonorSearchAttributes {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  status: DonorSearchStatus;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  countryCode: string;
  city: string;
  location: string;
  geohash: string;
  donationDateTime: string;
  contactNumber: string;
  patientName: string;
  seekerName: string;
  transportationInfo: string;
  shortDescription: string;
  notifiedEligibleDonors: Record<string, EligibleDonorInfo>;
}

export interface DonorSearchQueueAttributes {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  targetedExecutionTime?: number;
  remainingDonorsToFind?: number;
  currentNeighborSearchLevel: number;
  remainingGeohashesToProcess: string[];
  notifiedEligibleDonors: Record<string, EligibleDonorInfo>;
  initiationCount: number;
}

export interface AcceptDonationRequestAttributes {
  donorId: string;
  seekerId: string;
  createdAt: string;
  requestPostId: string;
  acceptanceTime?: string;
  status: AcceptDonationStatus;
  donorName: string;
  phoneNumbers: string[];
}

export interface DonationRecordEventAttributes {
  donorIds: string[];
  seekerId: string;
  requestPostId: string;
  requestCreatedAt: string;
}

export interface DonationRecordAttributes {
  donorId: string;
  seekerId: string;
  requestPostId: string;
  requestCreatedAt: string;
  requestedBloodGroup: BloodGroup;
  location: string;
  donationDateTime: string;
  createdAt?: string;
}

export type GetDonationRequestAttributes = {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
}

export type BloodDonationResponseAttributes = {
  requestPostId: string;
  createdAt: string;
}
