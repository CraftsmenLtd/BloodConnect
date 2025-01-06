import { useMemo } from 'react'
import { useUserProfile } from '../../context/UserProfileContext'
import { UserProfile } from '../../services/userProfileService'

export interface DonationLocation {
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface UserProfileDetails extends UserProfile {
  age: number;
  location: string;
  phone: string;
}

export const useProfile = (): { userDetails: UserProfileDetails } => {
  const { userProfile } = useUserProfile()

  const getLocation = (preferredDonationLocations: Array<{ city: string; area: string }>): string => {
    if (preferredDonationLocations.length > 0) {
      const { city = '', area = '' } = preferredDonationLocations[0]
      return `${city}, ${area}`
    }
    return ''
  }

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1
    }
    return age
  }

  const userDetails = useMemo(() => {
    const location = userProfile.preferredDonationLocations !== undefined ? getLocation(userProfile.preferredDonationLocations) : ''
    const age = userProfile.dateOfBirth !== undefined ? calculateAge(userProfile.dateOfBirth) : 0
    const phone = userProfile.phoneNumbers?.[0] ?? ''

    return {
      ...userProfile,
      location,
      age,
      phone
    }
  }, [userProfile])

  return { userDetails }
}
