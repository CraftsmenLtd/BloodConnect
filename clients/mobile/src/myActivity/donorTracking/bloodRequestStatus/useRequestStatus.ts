import { useNavigation, useRoute } from '@react-navigation/native'
import type { RequestStatusNavigationProp, RequestStatusRouteProp } from '../../../setup/navigation/navigationTypes'
import { SCREENS } from '../../../setup/constant/screens'
import useFetchData from '../../../setup/clients/useFetchData'
import { fetchSingleDonationPost } from '../../../donationWorkflow/donationService'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { extractErrorMessage, formatDonations } from '../../../donationWorkflow/donationHelpers'
import useCompleteDonation from '../useCompleteDonation'

const useRequestStatus = (): unknown => {
  const fetchClient = useFetchClient()
  const navigation = useNavigation<RequestStatusNavigationProp>()
  const { requestPostId, createdAt } = useRoute<RequestStatusRouteProp>().params
  const { executeFunction, loading: completeDonationLoading, error: completeDonationError } = useCompleteDonation()

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
    if (bloodRequest === null || bloodRequest === undefined) return

    const { acceptedDonors } = bloodRequest
    if (acceptedDonors?.length === 0) {
      void executeFunction([], requestPostId, createdAt)

      return
    }

    navigation.navigate(SCREENS.DONOR_CONFIRMATION, {
      requestPostId,
      donors: acceptedDonors ?? [],
      createdAt
    })
  }

  return { bloodRequest, notYetHandler, yesManagedHandler, loading, error, completeDonationLoading, completeDonationError }
}

export default useRequestStatus
