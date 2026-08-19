import { useEffect, useState } from 'react'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import { getDonorProfile } from '../../../userWorkflow/services/userServices'
import type { DonorItem } from './DonorResponses'

export type DonorResponseDetails = {
  profilePicture?: string;
  area?: string;
}

// Lives outside React so it survives the screen unmounting: each donor is fetched once per
// app session however often the responses page is reopened. Failures are deliberately not
// cached, so a donor whose profile could not be loaded is retried on the next visit.
const donorCache = new Map<string, DonorResponseDetails>()

export const clearDonorDetailsCache = (): void => { donorCache.clear() }

const splitIds = (donorIds: string): string[] => donorIds === '' ? [] : donorIds.split(',')

const readCache = (ids: string[]): Record<string, DonorResponseDetails> =>
  ids.reduce<Record<string, DonorResponseDetails>>((collected, donorId) => {
    const cached = donorCache.get(donorId)
    if (cached !== undefined) {
      collected[donorId] = cached
    }

    return collected
  }, {})

// Accepted-donor rows carry only id and name; picture and location come from each profile.
const useDonorResponses = (
  acceptedDonors: DonorItem[]
): Record<string, DonorResponseDetails> => {
  const fetchClient = useFetchClient()
  const donorIds = acceptedDonors.map((donor) => donor.donorId).join(',')
  const [donorDetails, setDonorDetails] = useState<Record<string, DonorResponseDetails>>(
    () => readCache(splitIds(donorIds))
  )

  useEffect(() => {
    let active = true
    const ids = splitIds(donorIds)
    // Show whatever is already cached before any request, including when the donor list
    // changes to one that is fully cached and nothing needs fetching.
    setDonorDetails(readCache(ids))

    const missing = ids.filter((donorId) => !donorCache.has(donorId))
    if (missing.length === 0) {
      return
    }

    const loadDonorDetails = async(): Promise<void> => {
      await Promise.all(
        missing.map(async(donorId) => {
          try {
            const response = await getDonorProfile(donorId, fetchClient)
            const profile = response.data

            donorCache.set(donorId, {
              ...(profile?.profilePicture !== undefined
                && profile.profilePicture !== ''
                && { profilePicture: profile.profilePicture }),
              ...(profile?.preferredDonationLocations?.[0]?.area !== undefined
                && { area: profile.preferredDonationLocations[0].area })
            })
          } catch (_error) {
            // A failed profile falls back to initials rather than breaking the whole list.
          }
        })
      )

      if (active) {
        setDonorDetails(readCache(ids))
      }
    }

    void loadDonorDetails()

    return () => { active = false }
    // fetchClient is excluded deliberately: useFetchClient builds a new instance every render,
    // so depending on it would re-run this effect (and refetch every donor) on each render.
  }, [donorIds])

  return donorDetails
}

export default useDonorResponses
