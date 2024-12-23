import React, { useState, useEffect, ReactNode, createContext, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { NavigationContainerRef, ParamListBase } from '@react-navigation/native'
import { SCREENS } from '../constant/screens'
import { parseJsonData } from '../../utility/jsonParser'
import { NotificationContextType } from './useNotificationContext'
import { NotificationData } from './NotificationData'
import { RootStackParamList } from '../navigation/navigationTypes'
import storageService from '../../utility/storageService'
import LOCAL_STORAGE_KEYS from '../constant/localStorageKeys'

const SCREEN_FOR_NOTIFICATION: Partial<Record<string, { screen: keyof RootStackParamList; getParams?: (data: Record<string, unknown>) => NotificationData }>> = {
  BLOOD_REQ_POST: { screen: SCREENS.BLOOD_REQUEST_PREVIEW, getParams: (data) => ({ notificationData: data }) },
  REQ_ACCEPTED: { screen: SCREENS.DONAR_RESPONSE, getParams: (data) => ({ notificationData: data }) }
}

export const initialNotificationState: NotificationContextType = {
  notificationData: null
}

export const NotificationContext = createContext<NotificationContextType>(initialNotificationState)

export const NotificationProvider: React.FC<{ children: ReactNode; navigationRef: NavigationContainerRef<ParamListBase> }> = ({ children, navigationRef }) => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)
  const navigationStateUnsubscribe = useRef<(() => void) | null>(null)

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isNotificationValid(response)) {
        const data = parseJsonData(response.notification.request.content.data.payload)
        const identifier = response.notification.request.identifier
        void storageService.storeItem(LOCAL_STORAGE_KEYS.LAST_PROCESSED_NOTIFICATION_KEY, identifier)
        setNotificationData(data as NotificationData)
        handleNotificationNavigation(response)
      }
    })

    const unsubscribe = navigationRef.addListener('state', () => {
      if (navigationRef.isReady()) {
        void handleLastNotification()
        unsubscribeNavigationState()
      }
    })

    navigationStateUnsubscribe.current = unsubscribe
    return () => { responseListener.remove() }
  }, [])

  const handleLastNotification = async() => {
    try {
      const response = await Notifications.getLastNotificationResponseAsync()
      if (response === null || !isNotificationValid(response)) return

      const identifier = response.notification.request.identifier
      const lastNotificationIdentifier = await storageService.getItem(LOCAL_STORAGE_KEYS.LAST_PROCESSED_NOTIFICATION_KEY)
      if (lastNotificationIdentifier === identifier) return
      void storageService.storeItem(LOCAL_STORAGE_KEYS.LAST_PROCESSED_NOTIFICATION_KEY, identifier)
      const data = parseJsonData(response.notification.request.content.data.payload)
      setNotificationData(data as NotificationData)
      handleNotificationNavigation(response)
    } catch {}
  }

  const unsubscribeNavigationState = () => {
    navigationStateUnsubscribe.current !== null && navigationStateUnsubscribe.current()
  }

  const isNotificationValid = (response: Notifications.NotificationResponse | null): boolean => {
    return (
      Object.keys(response?.notification.request.content.data.payload ?? {}).length > 0 &&
      response?.notification.request.identifier !== null
    )
  }

  const handleNotificationNavigation = (response: Notifications.NotificationResponse | null) => {
    if (response === null) return
    const { type } = response.notification.request.content.data
    const mapping = SCREEN_FOR_NOTIFICATION[type]

    if (mapping !== undefined) {
      const { screen, getParams } = mapping
      const params = getParams !== undefined
        ? getParams(parseJsonData<Record<string, unknown>>(response.notification.request.content.data.payload))
        : undefined
      if (navigationRef.isReady()) {
        navigationRef.navigate(screen, params as any)
      }
    } else {
      navigationRef.navigate(SCREENS.POSTS)
    }
  }

  return (
    <NotificationContext.Provider value={{ notificationData }}>
      {children}
    </NotificationContext.Provider>
  )
}
