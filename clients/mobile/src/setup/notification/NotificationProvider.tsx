import React, { useState, useEffect, ReactNode } from 'react'
import * as Notifications from 'expo-notifications'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { SCREENS } from '../constant/screens'
import { parseJsonData } from '../../utility/jsonParser'
import { NotificationContext } from './NotificationContext'
import { useNavigationReady } from './useNavigationReady'
import { NotificationData } from './NotificationData'

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
          const data = parseJsonData<NotificationData>(response?.notification.request.content.data.payload)

          if (data !== null) {
            setNotificationData(data)
            navigation.navigate(SCREENS.BLOOD_REQUEST_PREVIEW, { notificationData: data })
          } else {
            throw new Error('Parsed notification data is null or invalid.')
          }
        } else {
          throw new Error('Invalid or incomplete notification response.')
        }
      } catch (error) {
        throw new Error(
          `Error processing notification: ${
            error instanceof Error ? error.message : 'An unexpected error occurred'
          }`
        )
      }
    }

    void checkInitialNotification()

    const foregroundListener = Notifications.addNotificationReceivedListener(notification => {
      const data = parseJsonData<NotificationData>(notification.request.content.data.payload)
      if (data !== null) setNotificationData(data)
    })

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = parseJsonData<NotificationData>(response.notification.request.content.data.payload)
      if (isNotificationValid(response, isMounted) && data !== null) {
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
