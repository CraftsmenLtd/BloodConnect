import { NavigationProp } from '@react-navigation/native'

export const useNavigationReady = (navigation: NavigationProp<any>) => {
  return async(): Promise<void> => {
    let attempts = 0
    while (attempts < 10) {
      if (navigation.isReady()) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for 500ms
      attempts++
    }
    throw new Error('Navigation not ready')
  }
}
