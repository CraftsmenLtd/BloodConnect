import type { AcceptDonationStatus, AcceptedDonationDTO } from '../../../commons/dto/DonationDTO'
import type { NotificationType, NotificationStatus } from '../../../commons/dto/NotificationDTO'
import type { UserDTO } from '../../../commons/dto/UserDTO'

export interface NotificationAttributes {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  status?: NotificationStatus;
  payload: Record<string, unknown>;
}

export type DonationNotificationAttributes = Omit<NotificationAttributes, 'payload' | 'status'> & {
  payload: DonationRequestPayloadAttributes | DonationAcceptancePayloadAttributes;
  status: AcceptDonationStatus;
}

export type DonationRequestPayloadAttributes = {
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
  location: string;
  locationId?: string;
  shortDescription?: string;
  transportationInfo?: string;
  distance?: number;
}

export type DonationAcceptancePayloadAttributes = {
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

export interface StoreNotificationEndPoint extends UserDTO {
  snsEndpointArn: string;
  updatedAt?: string;
}

export interface SnsRegistrationAttributes {
  userId: string;
  deviceToken: string;
  platform: 'APNS' | 'FCM';
}
