import { Linking } from 'react-native'
import { openBrowserAsync } from 'expo-web-browser'

const SAFETY_EMAIL = 'support@bloodconnect.net'
const FALLBACK_URL = 'https://bloodconnect.net/child-safety/'

export const openSafetyReport = async (context?: string): Promise<void> => {
  const subject = encodeURIComponent('[Safety report]')
  const body = encodeURIComponent(
    'Describe what happened:\n\n'
      + `Reported user / post (if known): ${context ?? 'N/A'}\n`
  )
  const url = `mailto:${SAFETY_EMAIL}?subject=${subject}&body=${body}`
  const canOpen = await Linking.canOpenURL(url)
  if (canOpen) {
    await Linking.openURL(url)
  } else {
    await openBrowserAsync(FALLBACK_URL)
  }
}
