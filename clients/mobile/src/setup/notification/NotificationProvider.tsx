import React, { useState, useEffect, ReactNode, createContext } from 'react'
import * as Notifications from 'expo-notifications'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { SCREENS } from '../constant/screens'
import { parseJsonData } from '../../utility/jsonParser'
import { NotificationContextType } from './useNotificationContext'
import { useNavigationReady } from './useNavigationReady'
import { NotificationData, NotificationDataTypes } from './types'
import { RootStackParamList } from '../navigation/navigationTypes'

const NOTIFICATION_TO_SCREEN_MAP: Partial<Record<string, { screen: keyof RootStackParamList; getParams?: (data: Record<string, unknown>) => NotificationData }>> = {
  bloodRequestPost: { screen: SCREENS.BLOOD_REQUEST_PREVIEW },
  donorAcceptRequest: { screen: SCREENS.DONAR_RESPONSE, getParams: (data) => ({ notificationData: data }) }
}

export const initialNotificationState: NotificationDataTypes = {
  notificationData: null
}

export const NotificationContext = createContext<NotificationContextType>(initialNotificationState)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const waitForNavigationReady = useNavigationReady(navigation)

  useEffect(() => {
    let isMounted = true
    try { void checkInitialNotification(isMounted) } catch (error) { }

    const foregroundListener = Notifications.addNotificationReceivedListener(notification => {
      const data = parseJsonData<NotificationData>(notification.request.content.data.payload)
      if (data !== null) setNotificationData(data)
    })

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = parseJsonData(response.notification.request.content.data.payload)
      if (isNotificationValid(response, isMounted)) {
        setNotificationData(data as NotificationData)
        handleNotificationNavigation(response)
      }
    })

    return () => {
      isMounted = false
      foregroundListener.remove()
      responseListener.remove()
    }
  }, [navigation])

  const isNotificationValid = (response: Notifications.NotificationResponse | null, isMounted: boolean): boolean => {
    return (
      Object.keys(response?.notification.request.content.data.payload ?? {}).length > 0 &&
      response?.notification.request.identifier !== null &&
      isMounted
    )
  }

  const handleNotificationNavigation = (response: Notifications.NotificationResponse | null) => {
    if (response === null) return

    const { type } = response.notification.request.content.data
    const mapping = NOTIFICATION_TO_SCREEN_MAP[type]

    if (mapping !== undefined) {
      const { screen, getParams } = mapping
      const params = getParams !== undefined ? getParams(parseJsonData<Record<string, unknown>>(response.notification.request.content.data.payload)) : undefined
      navigation.navigate(screen, params as any)
    } else {
      throw new Error('Unknown notification.')
    }
  }

  const checkInitialNotification = async (isMounted: boolean) => {
    try {
      const response = await Notifications.getLastNotificationResponseAsync()
      if (isNotificationValid(response, isMounted)) {
        await waitForNavigationReady()
        const data = parseJsonData(response?.notification.request.content.data.payload)
        setNotificationData(data as NotificationData)
        handleNotificationNavigation(response)
      }
    } catch (error) {
      throw new Error(`Error processing notification: ${error}`)
    }
  }

  return (
    <NotificationContext.Provider value={{ notificationData }}>
      {children}
    </NotificationContext.Provider>
  )
}
