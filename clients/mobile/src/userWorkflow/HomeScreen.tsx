import { useState, useEffect, useRef } from 'react'
import { Text, View, Button, Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import axios from 'axios'
import { useNavigation } from '@react-navigation/native'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { platform } from '../setup/constant/platform'

Notifications.setNotificationHandler({
  handleNotification: async() => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
})
const HomeScreen = () => {
  const fetchClient = useFetchClient()
  const navigation = useNavigation()
  const [expoPushToken, setExpoPushToken] = useState('')
  const [notificationData, setNotificationData] = useState('')
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      // console.log(token)
      setExpoPushToken(token)
      void saveDeviceTokenToSNS(token)
    }).catch(error => { console.log(error) })

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification)
    })

    Notifications.addNotificationResponseReceivedListener(async response => {
      navigation.navigate(response.notification.request.content.data.screen)
      await axios.post('https://ci2mc9vlki.execute-api.ap-south-1.amazonaws.com/prod/notification-data', response)
      setNotificationData(JSON.stringify(response))
      console.log(response.notification.request.content.data.notificationData)
    })
    return () => { subscription.remove() }
  }, [])

  const saveDeviceTokenToSNS = async(deviceToken: string) => {
    try {
      const response = await fetchClient.post('/notification/register', { deviceToken, platform: 'FCM' })
      console.log('RESPONSE', response)
      if (response.status === 200) {
        console.log('Device register sucessful')
      } else {
        throw new Error('Failed to register Device.')
      }
      // const response = await axios.post('https://nz22m6e9ud.execute-api.ap-south-1.amazonaws.com/api/register', { userId: '2', deviceToken, platform: 'FCM' })
      // console.log('RESPONSE', response.message)
    } catch (error) {
      console.log('Failed To register device tokn', error)
    }
  }
  // const sendNotificationHandler = async() => {
  //   const message = {
  //     to: expoPushToken,
  //     sound: 'default',
  //     title: 'Blood Connect',
  //     body: 'Need O+ blood 2 bags.'
  //   }
  //   await fetch('https://exp.host/--/api/v2/push/send', {
  //     method: 'POST',
  //     headers: {
  //       host: 'exp.host',
  //       accept: 'application/json',
  //       'accept-encoding': 'gzip, deflate',
  //       'content-type': 'application/json'
  //     },
  //     body: JSON.stringify(message)
  //   })
  //   console.log('PUSH NOTIFICATION')
  // }

  async function registerForPushNotificationsAsync() {
    let token

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
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      // EAS projectId is used here.
      try {
        const projectId = 'Your project ID'
        if (projectId === null) {
          throw new Error('Project ID not found')
        }
        token = (await Notifications.getDevicePushTokenAsync({ projectId })).data
        console.log(token)
      } catch (e) {
        token = `${e}`
      }
    } else {
      alert('Must use physical device for Push Notifications')
    }

    return token
  }
  return (
    <View>
      <Text>HomeScreen</Text>
      <Text>{notificationData}</Text>
    </View>
  )
}

export default HomeScreen
