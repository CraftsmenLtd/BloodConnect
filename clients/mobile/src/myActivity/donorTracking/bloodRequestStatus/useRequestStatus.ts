import { useNavigation, useRoute } from '@react-navigation/native'
import { RequestStatusNavigationProp, RequestStatusRouteProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import useFetchData from '../../../setup/clients/useFetchData'
import { fetchSingleDonationPost } from '../../../donationWorkflow/donationService'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { extractErrorMessage, formatDonations } from '../../../donationWorkflow/donationHelpers'

const useRequestStatus = (): any => {
  const fetchClient = useFetchClient()
  const { requestPostId, createdAt } = useRoute<RequestStatusRouteProp>().params
  const navigation = useNavigation<RequestStatusNavigationProp>()
  const [, loading, bloodRequest, error] = useFetchData(async() => {
    const response = await fetchSingleDonationPost(requestPostId, createdAt, fetchClient)
    if (response.status === 200 && response.data !== undefined) {
      return formatDonations([response.data])[0]
    }
  }, { shouldExecuteOnMount: true, parseError: extractErrorMessage })

  const notYetHandler = (): void => {
    navigation.navigate(SCREENS.MY_ACTIVITY)
  }

  const yesManagedHandler = (): void => {
    navigation.navigate(SCREENS.DONOR_CONFIRMATION, { requestPostId, donors: bloodRequest?.acceptedDonors ?? [], createdAt })
  }

  return { bloodRequest, notYetHandler, yesManagedHandler, loading, error }
}

export default useRequestStatus