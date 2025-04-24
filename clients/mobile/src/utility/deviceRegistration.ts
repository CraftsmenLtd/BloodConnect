import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import type { HttpClient } from '../setup/clients/HttpClient'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { saveDeviceTokenOnSNS, saveDeviceTokenLocally } from '../setup/notification/saveDeviceToken'
import {
  registerForPushNotificationsAsync
} from '../setup/notification/registerForPushNotifications'

const registerUserDeviceForNotification = (fetchClient: HttpClient): void => {
  registerForPushNotificationsAsync().then(async token => {
    await saveDeviceTokenOnSNS(token as string, fetchClient)
    await saveDeviceTokenLocally(token as string)
  })
    .catch(error => {
      throw new Error(
        `Failed to register user device for notifications: ${
          error instanceof Error ? error.message : 'An unexpected error occurred'
        }`
      )
    })
}

export const useRegisterPushOnFocus = (): void => {
  const fetchClient = useFetchClient()

  useFocusEffect(
    useCallback(() => {
      const register = async() => {
        try {
          registerUserDeviceForNotification(fetchClient)
        } catch (error) {
          console.error('Failed to register device:', error)
        }
      }

      void register()
    }, [fetchClient])
  )
}

export default registerUserDeviceForNotification
