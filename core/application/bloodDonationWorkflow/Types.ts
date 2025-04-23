import type { ValidationRule } from '../utils/validator'
import { validateDonationDateTime, validateBloodQuantity } from '../utils/validator'
import type {
  AcceptDonationDTO,
  AcceptDonationStatus,
  BloodGroup,
  DonationDTO,
  DonationStatus,
  DonorSearchStatus,
  EligibleDonorInfo,
  UrgencyType
} from '../../../commons/dto/DonationDTO'

export type BloodDonationEventAttributes = {
  seekerId: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  location: string;
  latitude: number;
  longitude: number;
  donationDateTime: string;
  contactNumber: string;
  patientName?: string;
  transportationInfo?: string;
  shortDescription?: string;
}

export type BloodDonationAttributes = {
  seekerId: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  countryCode: string;
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

export const validationRules: Record<
  CredentialKeys,
  Array<ValidationRule<unknown>>> = {
    donationDateTime: [(value: string): boolean => validateDonationDateTime(value)],
    bloodQuantity: [(value: number): boolean => validateBloodQuantity(value)]
  }

export type UpdateBloodDonationAttributes = {
  requestPostId: string;
  seekerId: string;
  createdAt: string;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  donationDateTime: string;
  contactNumber: string;
  patientName?: string;
  seekerName?: string;
  transportationInfo?: string;
  shortDescription?: string;
}

export enum DynamoDBEventName {
  INSERT = 'INSERT',
  MODIFY = 'MODIFY'
}

export type DonorSearchConfig = {
  dynamodbTableName: string;
  awsRegion: string;
  cacheGeohashPrefixLength: number;
  maxGeohashCacheEntriesCount: number;
  maxGeohashCacheMbSize: number;
  maxGeohashCacheTimeoutMinutes: number;
  maxGeohashNeighborSearchLevel: number;
  donorSearchMaxInitiatingRetryCount: number;
  neighborSearchGeohashPrefixLength: number;
  donorSearchDelayBetweenExecution: number;
  maxGeohashPerProcessingBatch: number;
  maxGeohashesPerExecution: number;
  donorSearchQueueUrl: string;
}

export type DonationRequestInitiatorAttributes = {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  countryCode: string;
  location: string;
  patientName: string;
  status: DonationStatus;
  geohash: string;
  donationDateTime: string;
  contactNumber: string;
  transportationInfo: string;
  shortDescription: string;
  eventName?: DynamoDBEventName;
}

export type DonorSearchAttributes = {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  status: DonorSearchStatus;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  countryCode: string;
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

export type DonorSearchQueueAttributes = {
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

export type AcceptDonationRequestAttributes = {
  donorId: string;
  seekerId: string;
  createdAt: string;
  requestPostId: string;
  acceptanceTime?: string;
  status: AcceptDonationStatus;
  donorName: string;
  phoneNumbers: string[];
}

export type BloodDonationResponse = DonationDTO & {
  acceptedDonors: AcceptDonationDTO[];
}

export type DonationRecordEventAttributes = {
  donorIds: string[];
  seekerId: string;
  requestPostId: string;
  requestCreatedAt: string;
}

export type DonationRecordAttributes = {
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
