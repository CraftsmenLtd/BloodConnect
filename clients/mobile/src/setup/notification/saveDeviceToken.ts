import { Platform } from 'react-native'
import type { HttpClient } from '../clients/HttpClient'
import authService from '../../authentication/services/authService'
import StorageService from '../../utility/storageService'
import { TOKEN } from '../constant/token'

export const saveDeviceTokenOnSNS = async(
  deviceToken: string,
  fetchClient: HttpClient
): Promise<void> => {
  try {
    const response = await fetchClient.post('/notification/register', {
      deviceToken,
      platform: Platform.OS === 'android' ? 'FCM' : 'APNS'
    })

    if (response.status !== 200) {
      throw new Error(
        'Failed to register your device. Please login again'
      )
    }
    await saveDeviceTokenLocally(deviceToken)
  } catch (_error) {
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
