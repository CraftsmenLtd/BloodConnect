import Constants from 'expo-constants'

const { WEBSOCKET_URL } = Constants.expoConfig?.extra ?? {}

export const chatConfig = {
  websocketUrl: (WEBSOCKET_URL as string | undefined) ?? ''
}
