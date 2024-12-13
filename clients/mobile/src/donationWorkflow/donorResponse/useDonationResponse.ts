import { useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { SCREENS } from '../../setup/constant/screens'
import { DonarResponseRouteProp, RootStackParamList } from '../../setup/navigation/navigationTypes'

export const useDonationResponse = (): any => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, SCREENS.DONAR_RESPONSE>>()
  const route = useRoute<DonarResponseRouteProp>()

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
