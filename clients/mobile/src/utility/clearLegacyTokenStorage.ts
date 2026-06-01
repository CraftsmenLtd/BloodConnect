import AsyncStorage from '@react-native-async-storage/async-storage'

const COGNITO_KEY_PREFIX = 'CognitoIdentityServiceProvider.'
const LEGACY_KEYS = ['idToken', 'accessToken']

export const clearLegacyTokenStorage = async(): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys()
    const tokenKeys = allKeys.filter(
      (key) => key.startsWith(COGNITO_KEY_PREFIX) || LEGACY_KEYS.includes(key)
    )
    if (tokenKeys.length > 0) {
      await AsyncStorage.multiRemove(tokenKeys)
    }
  } catch {
    // best-effort cleanup; swallow to avoid blocking app boot
  }
}
