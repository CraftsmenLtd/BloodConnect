import { ValidationRule, validateDonationDateTime, validateBloodQuantity } from '../utils/validator'
import { AcceptDonationStatus, BloodGroup, UrgencyType } from '../../../commons/dto/DonationDTO'

export interface BloodDonationAttributes {
  seekerId: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  city: string;
  location: string;
  latitude: number;
  longitude: number;
  donationDateTime: string;
  contactNumber: string;
  patientName?: string;
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

export interface DonorRoutingAttributes {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  city: string;
  location: string;
  geohash: string;
  donationDateTime: string;
  contactNumber: string;
  patientName: string;
  transportationInfo: string;
  shortDescription: string;
}

export interface StepFunctionInput {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  donationDateTime: string;
  requestedBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyType;
  geohash: string;
  city: string;
  seekerName: string;
  patientName: string;
  location: string;
  contactNumber: string;
  transportationInfo: string;
  shortDescription: string;
  message: string;
  retryCount: number;
}

export interface StepFunctionExecutionAttributes {
  executionArn: string;
  status: string;
  startDate: string;
  input: StepFunctionInput;
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
