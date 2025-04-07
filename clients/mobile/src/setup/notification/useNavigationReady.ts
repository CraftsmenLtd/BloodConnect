import type { RequestPreviewScreenNavigationProp } from '../navigation/navigationTypes'

export const useNavigationReady = (navigation: RequestPreviewScreenNavigationProp) => {
  return async(): Promise<void> => {
    let attempts = 0
    while (attempts < 10) {
      if (navigation.isReady() === true) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      attempts++
    }
    throw new Error('Navigation not ready')
  }
}
