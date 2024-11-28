import { Platform } from 'react-native'
import { HttpClient } from '../clients/HttpClient'

export const saveDeviceTokenToSNS = async(
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
  } catch (error) {
    throw new Error(
      'An unexpected error occurred'
    )
  }
}
