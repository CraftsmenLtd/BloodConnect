import { createContext } from 'react'
import { NotificationData } from './NotificationData'

export type NotificationContextType = {
  notificationData: NotificationData | null;
  setNotificationData: (data: NotificationData | null) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)
