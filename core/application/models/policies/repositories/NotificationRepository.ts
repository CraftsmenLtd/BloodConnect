import type {DonationNotificationDTO, NotificationDTO } from '../../../../../commons/dto/NotificationDTO';
import type Repository from './Repository'

type NotificationRepository = {
  queryBloodDonationNotifications(
    requestPostId: string,
    status?: string
  ): Promise<(NotificationDTO | DonationNotificationDTO)[]>;

  getBloodDonationNotification(
    userId: string,
    requestPostId: string,
    type: string
  ): Promise<(NotificationDTO | DonationNotificationDTO) | null>;
} & Repository<(NotificationDTO | DonationNotificationDTO), Record<string, unknown>>
export default NotificationRepository
