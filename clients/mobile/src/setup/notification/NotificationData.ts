export type NotificationData = Record<string, unknown> | null

export type NotificationDataTypes = {
  notificationData: Record<string, unknown> | null;
}

export const initialNotificationState: NotificationDataTypes = {
  notificationData: null
}
