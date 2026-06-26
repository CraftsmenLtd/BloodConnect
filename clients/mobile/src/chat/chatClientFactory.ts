import Constants from 'expo-constants'
import authService from '../authentication/services/authService'
import { ChatWebSocketClient } from './ChatWebSocketClient'

// Builds a client wired to the deployed WebSocket endpoint and the Cognito access token (the
// $connect authorizer verifies the access token). Returns null when no endpoint is configured, so a
// build without WEBSOCKET_URL (chat gated off) degrades to no live socket rather than crashing.
export const createChatWebSocketClient = (): ChatWebSocketClient | null => {
  const { WEBSOCKET_URL } = (Constants.expoConfig?.extra ?? {}) as { WEBSOCKET_URL?: string }
  if (WEBSOCKET_URL === undefined || WEBSOCKET_URL === '') {
    return null
  }

  return new ChatWebSocketClient({
    url: WEBSOCKET_URL,
    getToken: async() => (await authService.fetchSession()).accessToken
  })
}
