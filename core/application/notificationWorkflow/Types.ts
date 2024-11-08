import { UserDTO } from '../../../commons/dto/UserDTO'

export interface NotificationAttributes {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationQueueMessage {
  userId: string;
  snsEndpointArn: string;
  payload: NotificationPayload;
}
export interface StoreNotificationEndPoint extends UserDTO {
  endpointArn: string;
  updatedAt?: string;
}

export interface SnsRegistrationAttributes {
  userId: string;
  deviceToken: string;
  platform: 'APNS' | 'FCM';
}
