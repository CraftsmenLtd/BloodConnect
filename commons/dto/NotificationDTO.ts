import type { AcceptDonationStatus, AcceptedDonationDTO } from './DonationDTO'
import type { DTO, HasIdentifier } from './DTOCommon'

export enum NotificationType {
  BLOOD_REQ_POST = 'BLOOD_REQ_POST',
  REQ_ACCEPTED = 'REQ_ACCEPTED',
  COMMON = 'COMMON'
}
export enum NotificationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  IGNORED = 'IGNORED'
}

export type NotificationDTO = DTO & HasIdentifier & {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  status?: NotificationStatus;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export type BloodDonationNotificationDTO = Omit<NotificationDTO, 'payload' | 'status'> & {
  payload: DonationRequestPayload | DonationAcceptancePayload;
  status: AcceptDonationStatus;
}

export type DonationRequestPayload = {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  bloodQuantity: number;
  requestedBloodGroup: string;
  urgencyLevel: string;
  contactNumber: string;
  donationDateTime: string;
  seekerName?: string;
  patientName?: string;
  location?: string;
  locationId?: string;
  shortDescription?: string;
  transportationInfo?: string;
  distance?: number;
}

export type DonationAcceptancePayload = {
  seekerId: string;
  requestPostId: string;
  donorId: string;
  createdAt: string;
  donorName: string;
  phoneNumbers: string[];
  requestedBloodGroup: string;
  urgencyLevel: string;
  location: string;
  donationDateTime: string;
  acceptedDonors?: AcceptedDonationDTO[];
  shortDescription?: string;
}
