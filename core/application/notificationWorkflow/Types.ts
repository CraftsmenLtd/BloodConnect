import { NotificationType } from '../../../commons/dto/NotificationDTO'
import { UserDTO } from '../../../commons/dto/UserDTO'

export interface NotificationAttributes {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}

export interface BloodPostNotificationAttributes {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload: {
    requestPostId: string;
    [key: string]: unknown;
  };
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
