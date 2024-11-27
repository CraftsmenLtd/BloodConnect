import { Platform } from 'react-native'
import { HttpClient } from '../clients/HttpClient'

export const saveDeviceTokenToSNS = async(deviceToken: string, fetchClient: HttpClient): Promise<void> => {
  try {
    const response = await fetchClient.post('/notification/register', {
      deviceToken,
      platform: Platform.OS === 'android' ? 'FCM' : 'APNS'
    })

    if (response.status !== 200) {
      throw new Error(`Failed to register device. Server responded with status: ${response.status}`)
    }
  } catch (error) {
    throw new Error(`Failed to register device token. ${error instanceof Error ? error.message : 'An unexpected error occurred'}`)
  }
}
