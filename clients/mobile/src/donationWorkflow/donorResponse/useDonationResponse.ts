import { useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { SCREENS } from '../../setup/constant/screens'
import { DonarResponseRouteProp, RootStackParamList } from '../../setup/navigation/navigationTypes'

// Correct typing for navigation
export const useDonationResponse = (): any => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, SCREENS.DONAR_RESPONSE>>()
  const route = useRoute<DonarResponseRouteProp>()

  const seeDetails = (): void => {
    // Use navigation.replace to navigate to the DETAILPOST screen
    navigation.replace(SCREENS.DETAILPOST, {
      data: route.params.notificationData,
      tab: 'Responses'
    })
  }

  const ignoreHandler = (): void => {
    // Use navigation.reset to navigate to the MY_ACTIVITY screen
    // navigation.reset({
    //   index: 0, // Reset the stack and set MY_ACTIVITY as the first route
    //   routes: [{ name: SCREENS.MY_ACTIVITY }]
    // })
    // navigation.replace(SCREENS.MY_ACTIVITY);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: SCREENS.BOTTOM_TABS, // assuming it's a bottom tabs navigator
          params: { screen: SCREENS.MY_ACTIVITY },
        },
      ],
    });
  }

  return {
    seeDetails,
    ignoreHandler,
    bloodRequest: route.params.notificationData
  }
}
