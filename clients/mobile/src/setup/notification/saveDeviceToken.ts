import { Platform } from 'react-native'
import authService from '../../authentication/services/authService'
import StorageService from '../../utility/storageService'
import { TOKEN } from '../constant/token'

export const saveDeviceTokenOnSNS = async(
  deviceToken: string,
  fetchClient: any
): Promise<void> => {
  try {
    const loggedInUser = await authService.currentLoggedInUser()

    if (await isDeviceAlreadyRegisteredForUser(deviceToken, loggedInUser.userId)) {
      return
    }

    const response = await fetchClient.post('/notification/register', {
      deviceToken,
      platform: Platform.OS === 'android' ? 'FCM' : 'APNS'
    })

    if (response.status !== 200) {
      const statusText = typeof response.statusText === 'string' ? response.statusText : 'Unknown error'
      throw new Error(
        `Failed to register device. Server responded with status: ${response.status} ${statusText}`
      )
    }
  } catch (error) {
    throw new Error(
      `Failed to register device token. ${
        error instanceof Error ? error.message : 'An unexpected error occurred'
      }`
    )
  }
}

export const saveDeviceTokenLocally = async(
  deviceToken: string
): Promise<void> => {
  const loggedInUser = await authService.currentLoggedInUser()
  await StorageService.storeItem<{ deviceToken: string; userId: string }>(
    TOKEN.DEVICE_TOKEN,
    { userId: loggedInUser.userId, deviceToken }
  )
}

export const isDeviceAlreadyRegisteredForUser = async(deviceToken: string, userId: string): Promise<boolean> => {
  const registeredDevice = await StorageService.getItem<
  { deviceToken: string; userId: string }
  >(TOKEN.DEVICE_TOKEN)

  return (registeredDevice != null) &&
    registeredDevice.deviceToken === deviceToken &&
    registeredDevice.userId === userId
}
