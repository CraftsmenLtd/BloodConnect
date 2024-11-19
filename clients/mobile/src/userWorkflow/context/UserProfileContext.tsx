import React, { createContext, useState, useContext, ReactNode } from 'react'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { checkUserProfile, UserProfile } from '../services/userProfileService'

interface UserProfileContextData {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<UserProfile | null>;
}

const UserProfileContext = createContext<UserProfileContextData | undefined>(undefined)

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const fetchClient = useFetchClient()

  const fetchUserProfile = async(): Promise<UserProfile | null> => {
    try {
      setLoading(true)
      setError(null)
      const profile = await checkUserProfile(fetchClient)
      setUserProfile(profile)
      return profile
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      return null
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
