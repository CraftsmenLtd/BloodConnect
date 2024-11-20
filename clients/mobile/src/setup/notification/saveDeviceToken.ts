import { Platform } from 'react-native'

export const saveDeviceTokenToSNS = async(
  deviceToken: string,
  fetchClient: any
): Promise<void> => {
  try {
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
