import Constants from 'expo-constants'

// Build-time rollout flag. Chat navigation routes and entry-point buttons are shown only when
// EXPO_PUBLIC_CHAT_ENABLED is 'true' (surfaced as CHAT_ENABLED in app.config extra). Any other
// value (including unset) keeps chat fully hidden.
export const isChatEnabled = (): boolean => {
  const { CHAT_ENABLED } = (Constants.expoConfig?.extra ?? {}) as { CHAT_ENABLED?: string }

  return CHAT_ENABLED === 'true'
}
