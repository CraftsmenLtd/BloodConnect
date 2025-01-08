import { Alert, Linking } from 'react-native'

export const openMapLocation = ({ location }: { location: string }): void => {
  const url = `https://www.google.com/maps?q=${encodeURIComponent(location)}`
  Linking.openURL(url).catch(() => { Alert.alert('Error', 'Failed to open the map. Please try again.') })
}
