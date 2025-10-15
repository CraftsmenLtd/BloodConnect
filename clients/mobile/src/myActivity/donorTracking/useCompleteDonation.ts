import { useNavigation } from '@react-navigation/native'
import { Alert } from 'react-native'
import useFetchData from '../../setup/clients/useFetchData'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { extractErrorMessage } from '../../donationWorkflow/donationHelpers'
import { completeDonation } from '../../donationWorkflow/donationService'
import { SCREENS } from '../../setup/constant/screens'
import type { DonorConfirmationNavigationProp } from '../../setup/navigation/navigationTypes'

type UseCompleteDonationReturn = {
  executeFunction: (donorIds: string[], requestPostId: string, createdAt: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const useCompleteDonation = (): UseCompleteDonationReturn => {
  const fetchClient = useFetchClient()
  const navigation = useNavigation<DonorConfirmationNavigationProp>()

  const handleSuccess = (): void => {
    Alert.alert(
      'Donation Completed',
      'Thank you for completing the donation!',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate(SCREENS.BOTTOM_TABS, { screen: SCREENS.MY_ACTIVITY })
          }
        }
      ]
    )
  }

  const [executeFunction, loading, , error] = useFetchData(
    async(donorIds: string[], requestPostId: string, createdAt: string) => {
      const response = await completeDonation(
        { requestPostId, requestCreatedAt: createdAt, donorIds },
        fetchClient
      )
      if (response.status === 200) {
        handleSuccess()
      }
    },
    { parseError: extractErrorMessage }
  )

  return { executeFunction, loading, error }
}

export default useCompleteDonation
