import * as Notifications from 'expo-notifications'

type NotificationTrigger =
  | { date: Date }
  | { seconds: number }
  | { repeats: boolean; interval: 'minute' | 'hour' | 'day' | 'week' }

export const scheduleNotification = async(trigger: NotificationTrigger, content: Notifications.NotificationContentInput): Promise<void> => {
  let notificationTrigger: Notifications.NotificationTriggerInput

  if ('date' in trigger) {
    notificationTrigger = trigger.date
  } else if ('seconds' in trigger) {
    notificationTrigger = { seconds: trigger.seconds }
  } else if ('repeats' in trigger) {
    notificationTrigger = {
      seconds: calculateIntervalInSeconds(trigger.interval),
      repeats: trigger.repeats
    }
  } else {
    throw new Error('Invalid notification trigger format.')
  }

  await Notifications.scheduleNotificationAsync({ content, trigger: notificationTrigger })
}

const calculateIntervalInSeconds = (interval: 'minute' | 'hour' | 'day' | 'week'): number => {
  switch (interval) {
    case 'minute':
      return 60
    case 'hour':
      return 60 * 60
    case 'day':
      return 24 * 60 * 60
    case 'week':
      return 7 * 24 * 60 * 60
    default:
      throw new Error('Invalid interval provided.')
  }
}

export const fetchScheduledNotifications = async(): Promise<Notifications.NotificationRequest[]> => {
  return await Notifications.getAllScheduledNotificationsAsync()
}

export const cancelNotificationById = async(identifier: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(identifier)
}