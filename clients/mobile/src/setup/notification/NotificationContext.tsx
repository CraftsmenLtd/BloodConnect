import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as Notifications from 'expo-notifications'
import { NavigationProp, useNavigation } from '@react-navigation/native'

type NotificationData = {
  patientName: string;
  neededBloodGroup: string;
  bloodQuantity: number;
  urgencyLevel: string;
  location: string;
  donationDateTime: string;
  contactNumber: string;
  transportationInfo: string;
  shortDescription: string;
  requestPostId: string;
  seekerId: string;
  createdAt: string;
}

type NotificationContextType = {
  notificationData: NotificationData | null;
  setNotificationData: (data: NotificationData | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)
  const navigation = useNavigation<NavigationProp<any>>()

  useEffect(() => {
    const foregroundListener = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data.notificationData

      if (data !== null) {
        setNotificationData(data)
      }
    })

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data.notificationData
      if (data !== null) {
        setNotificationData(data)
      }

      navigation.navigate('BloodRequestPreview' as never)
    })

    return () => {
      foregroundListener.remove()
      responseListener.remove()
    }
  }, [navigation])

  return (
    <NotificationContext.Provider value={{ notificationData, setNotificationData }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (context === null) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
