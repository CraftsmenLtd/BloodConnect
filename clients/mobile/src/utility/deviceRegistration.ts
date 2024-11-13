import { useFetchClient } from '../setup/clients/useFetchClient'
import { registerForPushNotificationsAsync, saveDeviceTokenToSNS } from '../setup/notification/Notification'

const registerUserDeviceForNotification = (): void => {
  const fetchClient = useFetchClient()

  registerForPushNotificationsAsync().then(token => {
    void saveDeviceTokenToSNS(token as string, fetchClient)
  }).catch(error => { console.error(error) })
}

export default registerUserDeviceForNotification
