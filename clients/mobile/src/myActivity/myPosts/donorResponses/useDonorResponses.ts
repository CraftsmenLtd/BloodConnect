import { useEffect, useState } from 'react'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { getDonorProfile } from '../../../userWorkflow/services/userServices'
import type { DonorItem } from './DonorResponses'

export type DonorResponseDetails = {
  profilePicture?: string;
  area?: string;
}

// The accepted-donor rows carry only an id and a name, so the picture and location shown in
// the list come from each donor's profile. Fetched per donor rather than denormalised onto
// the accepted row so the list never shows a stale picture after a donor updates it.
const useDonorResponses = (
  acceptedDonors: DonorItem[]
): Record<string, DonorResponseDetails> => {
  const fetchClient = useFetchClient()
  const [donorDetails, setDonorDetails] = useState<Record<string, DonorResponseDetails>>({})
  const donorIds = acceptedDonors.map((donor) => donor.donorId).join(',')

  useEffect(() => {
    let active = true
    const ids = donorIds === '' ? [] : donorIds.split(',')
    if (ids.length === 0) {
      setDonorDetails({})

      return
    }

    const loadDonorDetails = async(): Promise<void> => {
      const entries = await Promise.all(
        ids.map(async(donorId) => {
          try {
            const response = await getDonorProfile(donorId, fetchClient)
            const profile = response.data

            return [
              donorId,
              {
                ...(profile?.profilePicture !== undefined
                  && profile.profilePicture !== ''
                  && { profilePicture: profile.profilePicture }),
                ...(profile?.preferredDonationLocations?.[0]?.area !== undefined
                  && { area: profile.preferredDonationLocations[0].area })
              }
            ] as const
          } catch (_error) {
            // A donor whose profile fails to load still belongs in the list; they fall back
            // to initials and no location rather than breaking the whole list.
            return [donorId, {}] as const
          }
        })
      )

      if (active) {
        setDonorDetails(Object.fromEntries(entries))
      }
    }

    void loadDonorDetails()

    return () => { active = false }
  }, [donorIds, fetchClient])

  return donorDetails
}

export default useDonorResponses
