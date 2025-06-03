import type { ReactNode } from 'react';
import React, { createContext, useState, useContext } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { noopAsync } from '../../utility/noop'
import type { UserProfile } from '../services/userProfileService'
import { fetchUserProfileFromApi } from '../services/userProfileService'
import { ProfileError } from '../../utility/errors'
import storageService from '../../utility/storageService'
import LOCAL_STORAGE_KEYS from '../../setup/constant/localStorageKeys'

type UserProfileContextData = {
  userProfile: UserProfile;
  loading: boolean;
  error: string;
  fetchUserProfile: () => Promise<void>;
  updateUserProfileContext: (partialProfile: Partial<UserProfile>) => Promise<void>;
}

const defaultProfile: UserProfile = {
  bloodGroup: '',
  userId: '',
  name: '',
  lastDonationDate: '',
  height: null,
  weight: null,
  gender: '',
  dateOfBirth: '',
  availableForDonation: false,
  lastVaccinatedDate: '',
  NIDFront: '',
  NIDBack: '',
  phoneNumbers: [],
  preferredDonationLocations: [],
  locations: [],
  uniqueGeoPartitions: []
}

const UserProfileContext = createContext<UserProfileContextData | undefined>({
  userProfile: defaultProfile,
  loading: true,
  error: '',
  fetchUserProfile: noopAsync,
  updateUserProfileContext: noopAsync,
})

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const fetchClient = useFetchClient()

  function formatUserProfile(profile: UserProfile): UserProfile {
    return {
      bloodGroup: profile.bloodGroup ?? '',
      userId: profile.userId ?? '',
      name: profile.name ?? '',
      lastDonationDate: profile.lastDonationDate ?? '',
      height: profile.height ?? null,
      weight: profile.weight ?? null,
      gender: profile.gender ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      availableForDonation: profile.availableForDonation,
      lastVaccinatedDate: profile.lastVaccinatedDate ?? '',
      NIDFront: profile.NIDFront ?? '',
      NIDBack: profile.NIDBack ?? '',
      phoneNumbers: profile.phoneNumbers ?? [],
      preferredDonationLocations: profile.preferredDonationLocations?.map(location => ({
        area: location.area ?? '',
        geoHash: location.geoHash ?? '',
        geoPartition: location.geoPartition ?? '',
        latitude: location.latitude ?? 0,
        longitude: location.longitude ?? 0
      })) ?? [],
      locations: profile?.preferredDonationLocations?.map(location => {
        return location.area
      }) ?? [],
      uniqueGeoPartitions: [
        ...new Set(profile.preferredDonationLocations?.map(loc => loc.geoPartition))
      ]
    }
  }

  const fetchUserProfile = async(): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetchUserProfileFromApi(fetchClient)
      if (response.status === 200 && response.data !== null && response.data !== undefined) {
        const formattedProfile = formatUserProfile(response.data)
        await storageService.storeItem<UserProfile>(
          LOCAL_STORAGE_KEYS.USER_PROFILE, formattedProfile)
        setUserProfile(formattedProfile)
      } else {
        throw new ProfileError('Failed to get user profile data')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfileContext = async(partialProfile: Partial<UserProfile>): Promise<void> => {
    const updatedProfile: UserProfile = {
      ...userProfile,
      ...partialProfile,
      preferredDonationLocations: partialProfile.preferredDonationLocations ??
        userProfile.preferredDonationLocations,
      uniqueGeoPartitions: [
        ...new Set(
          (partialProfile.preferredDonationLocations ?? userProfile.preferredDonationLocations)
            .map(loc => loc.geoPartition)
        )
      ]
    }

    setUserProfile(updatedProfile)
    await storageService.storeItem<UserProfile>(LOCAL_STORAGE_KEYS.USER_PROFILE, updatedProfile)
  }

  return (
    <UserProfileContext.Provider value={{
      userProfile,
      loading,
      error,
      fetchUserProfile,
      updateUserProfileContext
    }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export const useUserProfile = (): UserProfileContextData => {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
}
