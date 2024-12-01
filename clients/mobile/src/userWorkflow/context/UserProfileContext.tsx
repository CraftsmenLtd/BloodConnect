import React, { createContext, useState, useContext, ReactNode } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { checkUserProfile, UserProfile } from '../services/userProfileService'
import { ProfileError } from '../../utility/errors'

interface UserProfileContextData {
  userProfile: UserProfile;
  loading: boolean;
  error: string;
  fetchUserProfile: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  bloodGroup: '',
  name: '',
  lastDonationDate: '',
  height: 0,
  weight: 0,
  gender: '',
  dateOfBirth: '',
  availableForDonation: '',
  lastVaccinatedDate: '',
  NIDFront: '',
  NIDBack: '',
  phoneNumbers: [],
  preferredDonationLocations: []
}

const UserProfileContext = createContext<UserProfileContextData | undefined>(undefined)

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const fetchClient = useFetchClient()

  function formatUserProfile(profile: UserProfile): UserProfile {
    return {
      bloodGroup: profile.bloodGroup ?? '',
      name: profile.name ?? '',
      lastDonationDate: profile.lastDonationDate ?? '',
      height: profile.height ?? 0,
      weight: profile.weight ?? 0,
      gender: profile.gender ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      availableForDonation: profile.availableForDonation ?? '',
      lastVaccinatedDate: profile.lastVaccinatedDate ?? '',
      NIDFront: profile.NIDFront ?? '',
      NIDBack: profile.NIDBack ?? '',
      phoneNumbers: profile.phoneNumbers ?? [],
      preferredDonationLocations: profile.preferredDonationLocations?.map(location => ({
        area: location.area ?? '',
        city: location.city ?? '',
        latitude: location.latitude ?? 0,
        longitude: location.longitude ?? 0
      })) ?? []
    }
  }

  const fetchUserProfile = async(): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      const response = await checkUserProfile(fetchClient)
      if (response.status === 200 && (response.data != null)) {
        const formattedProfile = formatUserProfile(response.data)
        setUserProfile(formattedProfile)
      } else {
        setUserProfile(defaultProfile)
        throw new ProfileError('Failed to get user profile data')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setUserProfile(defaultProfile)
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserProfileContext.Provider value={{
      userProfile,
      loading,
      error,
      fetchUserProfile
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
