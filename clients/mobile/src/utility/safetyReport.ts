import { Linking } from 'react-native'

const SAFETY_EMAIL = 'support@bloodconnect.net'

export const openSafetyReport = async (context?: string): Promise<void> => {
  const subject = encodeURIComponent('[Safety report]')
  const body = encodeURIComponent(
    'Describe what happened:\n\n'
      + `Reported user / post (if known): ${context ?? 'N/A'}\n`
  )
  await Linking.openURL(`mailto:${SAFETY_EMAIL}?subject=${subject}&body=${body}`)
}
