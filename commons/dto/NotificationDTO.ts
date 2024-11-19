import { DTO, HasIdentifier } from './DTOCommon'

export type NotificationDTO = DTO & HasIdentifier & {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
}
