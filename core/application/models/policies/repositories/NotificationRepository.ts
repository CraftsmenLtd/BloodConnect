import type { DTO } from '../../../../../commons/dto/DTOCommon'
import type Repository from './Repository'

type NotificationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> = {
  queryBloodDonationNotifications(
    requestPostId: string,
    status?: string
  ): Promise<T[]>;

  getBloodDonationNotification(
    userId: string,
    requestPostId: string,
    type: string
  ): Promise<T | null>;
} & Repository<T, DbFields>
export default NotificationRepository
