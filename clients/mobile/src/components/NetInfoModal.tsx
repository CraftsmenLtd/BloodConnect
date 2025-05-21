import React from 'react'
import { useNetInfo } from '../authentication/context/NetInfo'
import GenericModal from './modal'

export const NetInfoModal = (): React.ReactElement => {
  const { isConnected, refreshConnection } = useNetInfo()
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    setVisible(!isConnected)
  }, [isConnected])

  const handleRefreshConnection = async() : Promise<void> => {
    await refreshConnection()
    if (isConnected) setVisible(false)
  }

  if (isConnected && !visible) return null

  return <GenericModal
    visible={visible}
    title={!isConnected ? 'No Internet Connection' : 'Back Online!'}
    message={!isConnected
      ? 'Please check your network settings.'
      : 'Your connection has been restored.'
    }
    buttons={[
      { text: 'Refresh Connection', onPress: handleRefreshConnection }
    ]}
  />
}
