import { Platform } from 'react-native'
import authService from '../../authentication/services/authService'
import StorageService from '../../utility/storageService'
import { TOKEN } from '../constant/token'

export const saveDeviceTokenToSNS = async(
  deviceToken: string,
  fetchClient: any
): Promise<void> => {
  try {
    if (await checkDeviceAlreadyRegisteredForSameUser()) {
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
  const loggedInUser = await authService.currentLogInUser()
  await StorageService.storeItem<{ deviceToken: string; userId: string }>(
    TOKEN.DEVICE_TOKEN,
    { userId: loggedInUser.userId, deviceToken }
  )
}

export const checkDeviceAlreadyRegisteredForSameUser = async(): Promise<boolean> => {
  const registeredDevice = await StorageService.getItem<
  { deviceToken: string; userId: string }
  >(TOKEN.DEVICE_TOKEN)

  const loggedInUser = await authService.currentLogInUser()

  return (registeredDevice != null) && registeredDevice.userId === loggedInUser.userId
}
