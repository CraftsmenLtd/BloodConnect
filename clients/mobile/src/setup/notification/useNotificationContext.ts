import { useContext } from 'react'
import { NotificationContext, NotificationContextType } from './NotificationContext'

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (context === null) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context as NotificationContextType
}
