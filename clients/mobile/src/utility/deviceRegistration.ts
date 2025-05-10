import authService from '../authentication/services/authService'
import type { HttpClient } from '../setup/clients/HttpClient'
import { TOKEN } from '../setup/constant/token'
import {
  saveDeviceTokenOnSNS
} from '../setup/notification/saveDeviceToken'
import {
  registerForPushNotificationsAsync
} from '../setup/notification/registerForPushNotifications'
import StorageService from './storageService'

const registerUserDeviceForNotification = (fetchClient: HttpClient): Promise<void> =>
  registerForPushNotificationsAsync().then(async token => {
    const loggedInUser = await authService.currentLoggedInUser()

    if (!await isDeviceAlreadyRegisteredForUser(token, loggedInUser.userId)) {
      await saveDeviceTokenOnSNS(token as string, fetchClient)
    }
  }).catch(error => {
    throw new Error(
      `Failed to register user device for notifications: ${
        error instanceof Error ? error.message : 'An unexpected error occurred'
      }`
    )
  })


export const isDeviceAlreadyRegisteredForUser = async(
  deviceToken: string,
  userId: string
): Promise<boolean> => {
  const registeredDevice = await StorageService.getItem<
    { deviceToken: string; userId: string }
  >(TOKEN.DEVICE_TOKEN)
  return (registeredDevice != null) &&
    registeredDevice.deviceToken === deviceToken &&
    registeredDevice.userId === userId
}



export default registerUserDeviceForNotification
