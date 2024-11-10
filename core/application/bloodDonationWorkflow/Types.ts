import { ValidationRule, validateDonationDateTime, validateBloodQuantity } from '../utils/validator'
import { BloodGroup, UrgencyLevel } from '../../../commons/dto/DonationDTO'

export interface BloodDonationAttributes {
  seekerId: string;
  neededBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyLevel;
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
  bloodQuantity?: number;
  urgencyLevel?: UrgencyLevel;
  donationDateTime?: string;
  contactNumber?: string;
  patientCondition?: string;
  patientName?: string;
  transportationInfo?: string;
  shortDescription?: string;
  createdAt?: string;
}

export interface DonorRoutingAttributes {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
}

export interface StepFunctionInput {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  donationDateTime: string;
  neededBloodGroup: BloodGroup;
  bloodQuantity: number;
  urgencyLevel: UrgencyLevel;
  geohash: string;
  city: string;
  patientName?: string;
  location?: string;
  contactNumber?: string;
  transportationInfo?: string;
  shortDescription?: string;
  message?: string;
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
  acceptanceTime: string;
}
