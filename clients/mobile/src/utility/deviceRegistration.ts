import type { HttpClient } from '../setup/clients/HttpClient'
import { saveDeviceTokenOnSNS, saveDeviceTokenLocally } from '../setup/notification/saveDeviceToken'
import { registerForPushNotificationsAsync } from '../setup/notification/registerForPushNotifications'

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

export default registerUserDeviceForNotification
