import { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { DonorConfirmationNavigationProp, DonorConfirmationRouteProp } from '../../../setup/navigation/navigationTypes'
import useFetchData from '../../../setup/clients/useFetchData'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { extractErrorMessage } from '../../../donationWorkflow/donationHelpers'
import { completeDonation } from '../../../donationWorkflow/donationService'
import { Alert } from 'react-native'
import { SCREENS } from '../../../setup/constant/screens'

const useDonorConfirmation = (): any => {
  const fetchClient = useFetchClient()
  const navigation = useNavigation<DonorConfirmationNavigationProp>()
  const { donors, requestPostId, createdAt } = useRoute<DonorConfirmationRouteProp>().params
  const [selectedDonor, setSelectedDonor] = useState<string[]>([])

  const [executeFunction, loading, , error] = useFetchData(async(donorIds: string[]) => {
    const response = await completeDonation({ requestPostId, requestCreatedAt: createdAt, donorIds }, fetchClient)
    if (response.status === 200) {
      handleSuccess()
    }
  }, { parseError: extractErrorMessage })

  const handleSuccess = (): void => {
    Alert.alert(
      'Donation Completed',
      'Thank you for completing the donation!',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate(SCREENS.POSTS)
          }
        }
      ]
    )
  }

  const selectDonorHandler = (donorId: string): void => {
    if (selectedDonor.includes(donorId)) {
      setSelectedDonor(selectedDonor.filter(id => id !== donorId))
    } else {
      setSelectedDonor([...selectedDonor, donorId])
    }
  }

  return { donors, selectDonorHandler, selectedDonor, executeFunction, loading, error }
}

export default useDonorConfirmation
