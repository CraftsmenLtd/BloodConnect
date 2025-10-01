import React, { useEffect, useState } from 'react'
import { View, Image, StyleSheet, Dimensions } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'

const { width, height } = Dimensions.get('window')

type SplashScreenComponentProps = {
  onFinish: () => void
}

export default function SplashScreenComponent({ onFinish }: SplashScreenComponentProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync()

        // Simulate loading time or add actual loading logic here
        setTimeout(() => {
          setIsReady(true)
          SplashScreen.hideAsync()
          onFinish()
        }, 2000) // Show for 2 seconds

      } catch (e) {
        console.warn(e)
        setIsReady(true)
        onFinish()
      }
    }

    prepare()
  }, [onFinish])

  if (isReady) {
    return null
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 1000,
  },
  image: {
    width: '100%',
    height: '100%',
  },
})