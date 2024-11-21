import { useRoute } from '@react-navigation/native'
import { DonarProfileRouteProp } from '../setup/navigation/navigationTypes'
import { useEffect, useState } from 'react'
import { DonorProfile, getDonarProfile } from './services/userServices'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { Alert, Linking } from 'react-native'

const useDonarProfile = (): any => {
  const fetchClient = useFetchClient()
  const { donarId } = useRoute<DonarProfileRouteProp>().params

  const [donarProfile, setDonarProfile] = useState<DonorProfile>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getDonarInfo = async(): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await getDonarProfile(donarId, fetchClient)
        if (response.data) {
          setDonarProfile(response.data)
        }
      } catch (err) {
        setError('Failed to fetch donor profile.')
      } finally {
        setLoading(false)
      }
    }

    void getDonarInfo()
  }, [donarId])

  const handleCall = (): void => {
    if (Array.isArray(donarProfile.phoneNumbers) && donarProfile.phoneNumbers.length > 0) {
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
