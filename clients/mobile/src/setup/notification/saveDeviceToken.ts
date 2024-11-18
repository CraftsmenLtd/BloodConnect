/**
 * Saves the push notification device token to the backend server using SNS.
 *
 * This function sends a POST request to the `/notification/register` endpoint
 * to register the device token and platform information (e.g., 'FCM' for Android or 'APNS' for iOS).
 *
 * @param {string} deviceToken - The push notification token obtained from the device.
 * @param {any} fetchClient - An HTTP client instance (e.g., Axios) used for making the API request.
 *
 * @returns {Promise<void>} Resolves if the device token is successfully registered.
 * Logs an error message if the registration fails or an exception occurs.
 *
 * @example
 * const fetchClient = axios.create({ baseURL: 'https://api.example.com' });
 * const deviceToken = 'example_device_token';
 * 
 * await saveDeviceTokenToSNS(deviceToken, fetchClient);
 * console.log('Device token saved successfully.');
 */
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

    if (response.status === 200) {
      console.log('Device registered successfully')
    } else {
      console.error('Failed to register device')
    }
  } catch (error) {
    console.error('Failed to register device token:', error)
  }
}
