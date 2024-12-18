import { useRoute } from '@react-navigation/native'
import { DonarProfileRouteProp } from '../../setup/navigation/navigationTypes'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { Alert, Linking } from 'react-native'
import { DonorProfile, getDonarProfile } from '../../userWorkflow/services/userServices'
import useFetchData from '../../setup/clients/useFetchData'

type FormattedDonorProfile = Required<{
  [K in keyof DonorProfile]: DonorProfile[K] extends Array<infer U>
    ? U extends object
      ? Array<Required<U>>
      : DonorProfile[K]
    : DonorProfile[K];
}>

const useDonarProfile = (): any => {
  const fetchClient = useFetchClient()
  const { donarId } = useRoute<DonarProfileRouteProp>().params

  const formatDonarProfile = (donorProfile: DonorProfile): FormattedDonorProfile => {
    return {
      age: donorProfile.age ?? 0,
      bloodGroup: donorProfile.bloodGroup ?? '',
      donorName: donorProfile.donorName ?? '',
      gender: donorProfile.gender ?? '',
      height: donorProfile.height ?? 0,
      weight: donorProfile.weight ?? 0,
      phoneNumbers: Array.isArray(donorProfile.phoneNumbers) ? donorProfile.phoneNumbers : [],
      preferredDonationLocations: Array.isArray(donorProfile.preferredDonationLocations)
        ? donorProfile.preferredDonationLocations.map((location) => ({
          area: location?.area ?? '',
          city: location?.city ?? ''
        }))
        : []
    }
  }

  const { loading, error, data: donarProfile } = useFetchData<FormattedDonorProfile>(async() => {
    const response = await getDonarProfile(donarId, fetchClient)
    if (response.data !== undefined) {
      return formatDonarProfile(response.data)
    }
    throw new Error('Failed to fetch donor profile.')
  }, { shouldExecuteOnMount: true, errorMessage: 'Failed to fetch donor profile.' })

  const handleCall = (): void => {
    if (!Array.isArray(donarProfile?.phoneNumbers) || donarProfile.phoneNumbers.length === 0) {
      Alert.alert('No Phone Number', 'No phone number available for this donor.')
      return
    }

    const phoneNumber = donarProfile.phoneNumbers[0]
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call. Please try again later.')
    })
  }

  return { donarProfile, loading, error, handleCall }
}

export default useDonarProfile
