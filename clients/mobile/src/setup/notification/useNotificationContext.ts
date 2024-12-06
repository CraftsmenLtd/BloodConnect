import { useContext } from 'react'
import { NotificationContext } from './NotificationProvider'
import { NotificationData } from './NotificationData'

export interface NotificationContextType {
  notificationData: NotificationData | null;
}

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (context === null) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
