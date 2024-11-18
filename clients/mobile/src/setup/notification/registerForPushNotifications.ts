import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

const { projectId } = Constants.expoConfig?.extra?.eas ?? {}

export const registerForPushNotificationsAsync = async(): Promise<string | undefined> => {
  let token: string | undefined

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C'
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!')
      return
    }

    try {
      if (projectId === null) throw new Error('Project ID not found')

      token = (await Notifications.getDevicePushTokenAsync()).data
    } catch (error) {
      console.error('Failed to get push token:', error)
    }
  } else {
    alert('Must use physical device for Push Notifications')
  }

  return token
}
