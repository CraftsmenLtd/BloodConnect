import { DTO } from './DTOCommon'

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationQueueMessage extends DTO {
  userId: string;
  deviceToken: string;
  payload: NotificationPayload;
}

// export interface UserProfileDTO extends DTO {
//   userId: string;
//   deviceToken?: string;
// }
