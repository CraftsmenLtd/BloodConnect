import { useRoute } from '@react-navigation/native'
import { DonarProfileRouteProp } from '../../setup/navigation/navigationTypes'
import { useEffect, useState } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { Alert, Linking } from 'react-native'
import { getDonarProfile, DonorProfile } from '../../userWorkflow/services/userServices'

const useDonarProfile = (): any => {
  const fetchClient = useFetchClient()
  const { donarId } = useRoute<DonarProfileRouteProp>().params
  const [donarProfile, setDonarProfile] = useState<DonorProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void getDonarInfo() }, [donarId])

  const getDonarInfo = async(): Promise<void> => {
    try {
      const response = await getDonarProfile(donarId, fetchClient)
      if (response.data !== null && response.data !== undefined) {
        setDonarProfile(response.data)
      }
    } catch (err) {
      setError('Failed to fetch donor profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleCall = (): void => {
    if (donarProfile !== null && Array.isArray(donarProfile.phoneNumbers) && donarProfile.phoneNumbers.length > 0) {
      const phoneNumber = donarProfile.phoneNumbers[0]
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert('Error', 'Unable to make a call. Please try again later.')
      })
    } else {
      Alert.alert('No Phone Number', 'No phone number available for this donor.')
    }
  }

  return { donarProfile, loading, error, handleCall }
}

export default useDonarProfile
