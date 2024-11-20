import { useRoute } from '@react-navigation/native'
import { DonarResponseRouteProp } from '../../setup/navigation/navigationTypes'

export const useDonationResponse = (): any => {
  const route = useRoute<DonarResponseRouteProp>()

  return {
    bloodRequest: route.params.notificationData
  }
}
