import React, { createContext, useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { log } from '../../utility/logger'

type NetInfoContextType = {
  isConnected: boolean;
  refreshConnection: () => Promise<void>;
}

export const NetInfoContext = createContext<NetInfoContextType>({
  isConnected: true,
  refreshConnection: async() => {
    log.warn('refreshConnection called before initialization')
  }
})

export const NetInfoProvider = (
  { children }:
  { children: React.ReactNode }
): React.ReactElement => {
  const [isConnected, setIsConnected] = useState<boolean>(true)

  const refreshConnection = async(): Promise<void> => {
    try {
      const state = await NetInfo.fetch()
      setIsConnected(!!state.isConnected)
    } catch (error) {
      log.error('Error checking connection:', error)
      setIsConnected(false)
    }
  }

  useEffect((): (() => void) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connectionStatus = !!state.isConnected
      setIsConnected(connectionStatus)
    })

    return () => unsubscribe()
  }, [isConnected])

  return (
    <NetInfoContext.Provider value={{ isConnected, refreshConnection }}>
      {children}
    </NetInfoContext.Provider>
  )
}

export const useNetInfo = (): NetInfoContextType => {
  const context = React.useContext(NetInfoContext)
  if (!context) {
    throw new Error('useNetInfo must be used within a NetInfoProvider')
  }

  return context
}
