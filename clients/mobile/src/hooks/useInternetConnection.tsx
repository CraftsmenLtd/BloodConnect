import { useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { useNavigation } from '@react-navigation/native'
import { NoInternetNavigationProp } from '../setup/navigation/navigationTypes'

export const useInternetConnection = () => {
  const navigation = useNavigation<NoInternetNavigationProp>()
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected)
    })

    return () => { unsubscribe() }
  }, [])

  const checkConnection = () => {
    NetInfo.fetch()
      .then((state) => {
        if (state.isConnected === true) {
          navigation.goBack()
        } else {
          setIsConnected(false)
        }
      })
      .catch(() => { })
  }

  return { isConnected, checkConnection }
}
