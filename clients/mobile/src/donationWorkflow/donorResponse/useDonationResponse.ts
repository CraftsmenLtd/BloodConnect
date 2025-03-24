import { useRoute, useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { SCREENS } from '../../setup/constant/screens'
import type { DonorResponseRouteProp, RootStackParamList } from '../../setup/navigation/navigationTypes'

export const useDonationResponse = (): unknown => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, SCREENS.DONOR_RESPONSE>>()
  const route = useRoute<DonorResponseRouteProp>()

  const seeDetails = (): void => {
    navigation.replace(SCREENS.DETAIL_POST, {
      data: route.params.notificationData,
      tab: 'Responses'
    })
  }

  const ignoreHandler = (): void => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: SCREENS.BOTTOM_TABS,
          params: { screen: SCREENS.MY_ACTIVITY }
        }
      ]
    })
  }

  return {
    seeDetails,
    ignoreHandler,
    bloodRequest: route.params.notificationData
  }
}
