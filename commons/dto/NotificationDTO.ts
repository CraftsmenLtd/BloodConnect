import { DTO, HasIdentifier } from './DTOCommon'

export type NotificationType = 'BLOOD_REQ_POST' | 'REQ_ACCEPTED' | 'COMMON'

export type NotificationDTO = DTO & HasIdentifier & {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload?: Record<string, unknown>;
  createdAt?: string;
}
