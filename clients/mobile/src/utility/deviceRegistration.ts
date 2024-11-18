import { HttpClient } from '../setup/clients/HttpClient'
import { saveDeviceTokenToSNS } from '../setup/notification/saveDeviceToken'
import { registerForPushNotificationsAsync } from '../setup/notification/registerForPushNotifications'

const registerUserDeviceForNotification = (fetchClient: HttpClient): void => {
  registerForPushNotificationsAsync().then(token => {
    console.log('device token: ', token)
    void saveDeviceTokenToSNS(token as string, fetchClient)
  }).catch(error => { console.error(error) })
}

export default registerUserDeviceForNotification
