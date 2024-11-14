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

type RootStackParamList = {
  Home: undefined;
  BloodRequestPreview: { notificationData: NotificationData };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()

  useEffect(() => {
    let isMounted = true

    const checkInitialNotification = async() => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync()
        if (response !== null && isMounted) {
          await waitForNavigationReady()
          setNotificationData(response.notification.request.content.data.notificationData)
          navigation.navigate('BloodRequestPreview', {
            notificationData: response.notification.request.content.data.notificationData,
          })
        }
      } catch (error) {
        console.error('Error processing notification:', error)
      }
    }

    // Function to wait until navigation is ready
    const waitForNavigationReady = async() => {
      return new Promise<void>((resolve, reject) => {
        let attempts = 0
        const interval = setInterval(() => {
          if (navigation.isReady()) {
            clearInterval(interval)
            resolve()
          } else if (attempts >= 10) {
            clearInterval(interval)
            console.warn('Navigation is still not ready after 10 attempts.')
            reject(new Error('Navigation not ready'))
          }
          attempts++
        }, 500)
      })
    }

    void checkInitialNotification()

    const foregroundListener = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data.notificationData
      if (data !== null) setNotificationData(data)
    })

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data.notificationData
      if (data !== null) {
        setNotificationData(data)
        navigation.navigate('BloodRequestPreview', { notificationData: data })
      }
    })

    return () => {
      isMounted = false
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
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
