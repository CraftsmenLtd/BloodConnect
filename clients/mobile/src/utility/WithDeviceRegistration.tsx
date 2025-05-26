import { useFocusEffect } from '@react-navigation/native'
import type { ComponentType, FC } from 'react'
import { useCallback } from 'react'
import { InteractionManager } from 'react-native'
import { useAuth } from '../authentication/context/useAuth'
import { useFetchClient } from '../setup/clients/useFetchClient'
import registerUserDeviceForNotification from './deviceRegistration'

export function withRegisterPushOnFocus<P>(WrappedComponent: ComponentType<P>): FC<P> {
  return function ComponentWithPushRegistration(props: P) {
    const fetchClient = useFetchClient()
    const { isAuthenticated } = useAuth()

    useFocusEffect(
      useCallback(() => {
        const task = InteractionManager.runAfterInteractions(() => {
          if (!isAuthenticated) return
          void registerUserDeviceForNotification(fetchClient).catch(error => {
            // eslint-disable-next-line no-console
            console.error('Failed to register device:', error)
          })
        });

        return () => task.cancel();
      }, [fetchClient])
    )

    return <WrappedComponent {...props} />
  }
}
