import { useContext } from 'react'
import { NotificationContextType } from './NotificationContext'
import { NotificationContext } from './NotificationProvider'

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (context === null) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
