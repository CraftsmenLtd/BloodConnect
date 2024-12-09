import { DTO } from '../../../../../commons/dto/DTOCommon'
import Repository from './Repository'

export default interface NotificationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> extends Repository<T, DbFields> {
  queryBloodDonationNotifications(
    requestPostId: string
  ): Promise<T[] | null>;

  getBloodDonationNotification(
    userId: string,
    requestPostId: string,
    type: string
  ): Promise<T | null>;
}
