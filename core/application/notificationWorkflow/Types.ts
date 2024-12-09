import { NotificationType } from '../../../commons/dto/NotificationDTO'
import { UserDTO } from '../../../commons/dto/UserDTO'

export interface NotificationAttributes {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}

export interface BloodDonationNotificationAttributes {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload: BloodDonationPayloadAttributes;
}

export interface BloodDonationPayloadAttributes {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  bloodQuantity: string;
  requestedBloodGroup: string;
  urgencyLevel: string;
  contactNumber: string;
  donationDateTime: string;
  seekerName: string;
  patientName?: string;
  location?: string;
  locationId: string;
  shortDescription?: string;
  transportationInfo?: string;
  distance?: number;
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
