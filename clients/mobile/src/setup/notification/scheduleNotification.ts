import * as Notifications from 'expo-notifications';
import { replaceTemplatePlaceholders } from '../../utility/formatting'
import storageService from '../../utility/storageService'
import {
  LOCAL_NOTIFICATION_TYPE,
  REMINDER_NOTIFICATION_BODY,
  REMINDER_NOTIFICATION_TITLE,
  REMINDING_HOURS_BEFORE_DONATION
} from '../constant/consts'
import LOCAL_STORAGE_KEYS from '../constant/localStorageKeys'

type NotificationTrigger =
  | { date: Date }
  | { seconds: number }
  | { repeats: boolean; interval: 'minute' | 'hour' | 'day' | 'week' }

export const scheduleNotification = async(
  trigger: NotificationTrigger, 
  content: Notifications.NotificationContentInput
): Promise<string> => {
  return await Notifications.scheduleNotificationAsync({
    content,
    trigger: notificationTrigger(trigger)
  })
}

const notificationTrigger = (
  trigger: NotificationTrigger
):
  Notifications.NotificationTriggerInput => {
  if ('date' in trigger) {
    return trigger.date
  } else if ('seconds' in trigger) {
    return { seconds: trigger.seconds }
  } else if ('repeats' in trigger) {
    return {
      seconds: calculateIntervalInSeconds(trigger.interval),
      repeats: trigger.repeats
    }
  } else {
    throw new Error('Invalid notification trigger format.')
  }
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

export const fetchScheduledNotifications = async():
  Promise<Notifications.NotificationRequest[]> =>
{
  return Notifications.getAllScheduledNotificationsAsync()
}

export const cancelNotificationById = async(identifier: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(identifier)
}

export const handleNotification = (donationDateTime: string | Date): void => {
  const donationTime = new Date(donationDateTime)

  REMINDING_HOURS_BEFORE_DONATION.forEach((hoursBefore) => {
    const reminderTime = new Date(donationTime.getTime() - hoursBefore * 60 * 60 * 1000)
    const content = {
      title: hoursBefore === 1
        ? REMINDER_NOTIFICATION_TITLE.FINAL
        : replaceTemplatePlaceholders(REMINDER_NOTIFICATION_TITLE.DEFAULT, hoursBefore.toString()),
      body: hoursBefore === 1
        ? REMINDER_NOTIFICATION_BODY.FINAL
        : replaceTemplatePlaceholders(REMINDER_NOTIFICATION_BODY.DEFAULT, hoursBefore.toString()),
      data: { payload: {}, type: LOCAL_NOTIFICATION_TYPE.REMINDER }
    }
    const id = scheduleNotification({ date: reminderTime }, content)

    void storageService.storeItem(
      `${LOCAL_STORAGE_KEYS.LOCAL_NOTIFICATION_KEY_PREFIX}-${donationDateTime}`,
      id
    )
  })
}

export const cancelNotification = async(donationDateTime: string | Date): Promise<void> => {
  const existingId = await storageService.getItem<string>(
    `${LOCAL_STORAGE_KEYS.LOCAL_NOTIFICATION_KEY_PREFIX}-${donationDateTime}`
  )

  if (!existingId) {
    return
  }

  void Notifications.cancelScheduledNotificationAsync(existingId)
}
