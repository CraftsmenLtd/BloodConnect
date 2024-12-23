import { useState, useEffect } from 'react'
import { BackHandler, ToastAndroid } from 'react-native'

const useBackPressHandler = () => {
  const [backPressedOnce, setBackPressedOnce] = useState(false)

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => { backHandler.remove() }
  }, [backPressedOnce])

  const backAction = () => {
    if (backPressedOnce) {
      BackHandler.exitApp()
    } else {
      setBackPressedOnce(true)
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT)
      setTimeout(() => {
        setBackPressedOnce(false)
      }, 2000)
    }
    return true
  }
}

export default useBackPressHandler
