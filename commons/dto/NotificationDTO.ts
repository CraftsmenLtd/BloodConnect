import { DTO, HasIdentifier } from './DTOCommon'

export type NotificationDTO = DTO & HasIdentifier & {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
  createdAt?: string;
}
