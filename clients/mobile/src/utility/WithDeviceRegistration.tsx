import { useFocusEffect } from '@react-navigation/native'
import type { ComponentType, FC } from 'react';
import { useCallback } from 'react'
import { InteractionManager } from 'react-native'
import { useFetchClient } from '../setup/clients/useFetchClient'
import registerUserDeviceForNotification from './deviceRegistration'

export function withRegisterPushOnFocus<P>(WrappedComponent: ComponentType<P>): FC<P> {
  const ComponentWithPushRegistration: FC<P> = (props) => {
    const fetchClient = useFetchClient()

    useFocusEffect(
      useCallback(() => {
        const register = async() => registerUserDeviceForNotification(fetchClient).catch(
          // eslint-disable-next-line no-console
          (error) => { console.error('Failed to register device:', error) })

        const task = InteractionManager.runAfterInteractions(() => {
          void register()
        })

        return () => task.cancel()
      }, [fetchClient])
    )

    return <WrappedComponent {...props} />
  }

  return ComponentWithPushRegistration
}
