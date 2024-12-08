import { DTO, HasIdentifier } from './DTOCommon'

export type NotificationType = 'BLOOD_REQ_POST' | 'REQ_ACCEPTED' | 'COMMON'

export enum NotificationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED'
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
