import { HttpClient } from '../setup/clients/HttpClient'
import { registerForPushNotificationsAsync, saveDeviceTokenToSNS } from '../setup/notification/Notification'

const registerUserDeviceForNotification = (fetchClient: HttpClient): void => {
  console.log('registerUserDeviceForNotification')

  registerForPushNotificationsAsync().then(token => {
    void saveDeviceTokenToSNS(token as string, fetchClient)
  }).catch(error => { console.error(error) })
}

export default registerUserDeviceForNotification
