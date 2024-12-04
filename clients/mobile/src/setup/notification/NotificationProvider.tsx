import React, { useState, useEffect, ReactNode, createContext } from 'react'
import * as Notifications from 'expo-notifications'
import { NavigationContainerRef, ParamListBase } from '@react-navigation/native'
import { SCREENS } from '../constant/screens'
import { parseJsonData } from '../../utility/jsonParser'
import { NotificationContextType } from './useNotificationContext'
import { NotificationData, NotificationDataTypes } from './NotificationData'
import { RootStackParamList } from '../navigation/navigationTypes'

const SCREEN_FOR_NOTIFICATION: Partial<Record<string, { screen: keyof RootStackParamList; getParams?: (data: Record<string, unknown>) => NotificationData }>> = {
  bloodRequestPost: { screen: SCREENS.BLOOD_REQUEST_PREVIEW },
  donorAcceptRequest: { screen: SCREENS.DONAR_RESPONSE, getParams: (data) => ({ notificationData: data }) }
}

export const initialNotificationState: NotificationDataTypes = {
  notificationData: null
}

export const NotificationContext = createContext<NotificationContextType>(initialNotificationState)

export const NotificationProvider: React.FC<{ children: ReactNode; navigationRef: NavigationContainerRef<ParamListBase> }> = ({ children, navigationRef }) => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)
  const [isReady, setIsReady] = useState(false)
  const listenerAddedRef = React.useRef(false)
  const lastProcessedNotification = React.useRef<string | null>(null)

  useEffect(() => {
    if (!listenerAddedRef.current) {
      const unsubscribe = navigationRef.addListener('state', () => {
        if (navigationRef.isReady() && !isReady) setIsReady(true)
      })
      listenerAddedRef.current = true
      return () => {
        unsubscribe()
        listenerAddedRef.current = false
      }
    }
  }, [navigationRef, isReady])

  useEffect(() => {
    if (!isReady) return

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response === null || !isNotificationValid(response)) return

      const identifier = response.notification.request.identifier
      if (lastProcessedNotification.current === identifier) return

      lastProcessedNotification.current = identifier
      const data = parseJsonData(response.notification.request.content.data.payload)
      setNotificationData(data as NotificationData)
      handleNotificationNavigation(response)
    }).catch(() => { })

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isNotificationValid(response)) {
        const data = parseJsonData(response.notification.request.content.data.payload)
        setNotificationData(data as NotificationData)
        handleNotificationNavigation(response)
      }
    })

    return () => { responseListener.remove() }
  }, [navigationRef, isReady])

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
      const params = getParams !== undefined ? getParams(parseJsonData<Record<string, unknown>>(response.notification.request.content.data.payload)) : undefined
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
