import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

const { projectId } = Constants.expoConfig?.extra?.eas ?? {}

export const registerForPushNotificationsAsync = async(): Promise<string | undefined> => {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.')
  }

  try {
    if (Platform.OS === 'android') {
      await setupAndroidNotificationChannel()
    }

    const notificationPermission = await getNotificationPermissions()

    if (notificationPermission !== 'granted') {
      throw new Error('Push notification permissions not granted.')
    }

    return await getDevicePushToken()
  } catch (error) {
    throw new Error('Failed device registration. Try again')
  }
}

const setupAndroidNotificationChannel = async(): Promise<void> => {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C'
  })
}

const getNotificationPermissions = async(): Promise<Notifications.PermissionStatus> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    return status
  }

  return existingStatus
}

const getDevicePushToken = async(): Promise<string> => {
  if (projectId === null) {
    throw new Error('Expo project ID not found.')
  }

  const token = (await Notifications.getDevicePushTokenAsync()).data
  if (token === null) {
    throw new Error('Failed to retrieve device push token.')
  }

  return token
}
