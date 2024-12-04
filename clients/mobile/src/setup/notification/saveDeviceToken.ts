import { Platform } from 'react-native'
import { HttpClient } from '../clients/HttpClient'
import authService from '../../authentication/services/authService'
import StorageService from '../../utility/storageService'
import { TOKEN } from '../constant/token'

export const saveDeviceTokenOnSNS = async(
  deviceToken: string,
  fetchClient: HttpClient
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
      throw new Error(
        'Failed to register your device. Please login again'
      )
    }
  } catch (error) {
    throw new Error(
      'An unexpected error occurred'
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
