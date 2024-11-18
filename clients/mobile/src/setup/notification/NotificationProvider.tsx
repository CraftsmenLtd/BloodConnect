import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as Notifications from 'expo-notifications'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { SCREENS } from '../constant/screens'
import { parseJsonData } from '../../utility/jsonParser'
import { NotificationContext } from './NotificationContext'
import { useNavigationReady } from './useNavigationReady'
// import { useNotificationContext } from './useNotificationContext'

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

type RootStackParamList = {
  Home: undefined;
  ResponseDonationRequest: { notificationData: NotificationData };
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const waitForNavigationReady = useNavigationReady(navigation)

  useEffect(() => {
    let isMounted = true

    const isNotificationValid = (
      response: Notifications.NotificationResponse | null,
      isMounted: boolean
    ): boolean => {
      return (
        Object.keys(response?.notification.request.content.data.payload ?? {}).length > 0 &&
        response?.notification.request.identifier !== null &&
        isMounted
      )
    }

    const checkInitialNotification = async() => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync()
        if (isNotificationValid(response, isMounted)) {
          await waitForNavigationReady()
          const data = parseJsonData(response?.notification.request.content.data.payload)
          setNotificationData(data)
          navigation.navigate(SCREENS.BLOOD_REQUEST_PREVIEW, {
            notificationData: data
          })
        }
      } catch (error) {
        console.error('Error processing notification:', error)
      }
    }

    void checkInitialNotification()

    const foregroundListener = Notifications.addNotificationReceivedListener(notification => {
      const data = parseJsonData(notification.request.content.data.payload)
      if (data !== null) setNotificationData(data)
    })

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = parseJsonData(response.notification.request.content.data.payload)
      if (isNotificationValid(response, isMounted)) {
        setNotificationData(data)
        navigation.navigate(SCREENS.BLOOD_REQUEST_PREVIEW, { notificationData: data })
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
