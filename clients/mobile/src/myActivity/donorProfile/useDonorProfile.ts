import { useRoute } from '@react-navigation/native'
import { DonorProfileRouteProp } from '../../setup/navigation/navigationTypes'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { Alert, Linking } from 'react-native'
import { DonorProfile, getDonorProfile } from '../../userWorkflow/services/userServices'
import useFetchData from '../../setup/clients/useFetchData'

type FormattedDonorProfile = Required<{
  [K in keyof DonorProfile]: DonorProfile[K] extends Array<infer U>
    ? U extends object
      ? Array<Required<U>>
      : DonorProfile[K]
    : DonorProfile[K];
}>

const useDonorProfile = (): any => {
  const fetchClient = useFetchClient()
  const { donorId } = useRoute<DonorProfileRouteProp>().params

  const formatDonorProfile = (donorProfile: DonorProfile): FormattedDonorProfile => {
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
          area: location?.area ?? ''
        }))
        : []
    }
  }

  const [, loading, donorProfile, error] = useFetchData<FormattedDonorProfile>(async() => {
    const response = await getDonorProfile(donorId, fetchClient)
    if (response.data !== undefined) {
      return formatDonorProfile(response.data)
    }
    throw new Error('Failed to fetch donor profile.')
  }, { shouldExecuteOnMount: true, errorMessage: 'Failed to fetch donor profile.' })

  const handleCall = (): void => {
    if (!Array.isArray(donorProfile?.phoneNumbers) || donorProfile.phoneNumbers.length === 0) {
      Alert.alert('No Phone Number', 'No phone number available for this donor.')
      return
    }

    const phoneNumber = donorProfile.phoneNumbers[0]
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call. Please try again later.')
    })
  }

  return { donorProfile, loading, error, handleCall }
}

export default useDonorProfile
