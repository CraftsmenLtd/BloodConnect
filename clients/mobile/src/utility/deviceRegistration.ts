import { HttpClient } from '../setup/clients/HttpClient'
import { saveDeviceTokenToSNS } from '../setup/notification/saveDeviceToken'
import { registerForPushNotificationsAsync } from '../setup/notification/registerForPushNotifications'

const registerUserDeviceForNotification = (fetchClient: HttpClient): void => {
  registerForPushNotificationsAsync().then(token => {
    void saveDeviceTokenToSNS(token as string, fetchClient)
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
