import { useState, useMemo } from 'react'
import { User } from '../../account/hooks/useAccount'
import { UserDetailsDTO } from '../../../../../../commons/dto/UserDTO'
import { useUserProfile } from '../../context/UserProfileContext'

type Gender = 'male' | 'female' | 'other'

export interface DonationLocation {
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  bloodGroup: string;
  name: string;
  lastDonationDate: string;
  height: number;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  availableForDonation: string;
  lastVaccinatedDate: string;
  NIDFront: string;
  NIDBack: string;
  phoneNumbers: string[];
  preferredDonationLocations: DonationLocation[];
}

export interface UserProfileDetails extends UserProfile {
  age: number;
  location: string;
}

const defaultProfile: UserProfile = {
  bloodGroup: '',
  name: '',
  lastDonationDate: '',
  height: 0,
  weight: 0,
  gender: 'other',
  dateOfBirth: '',
  availableForDonation: '',
  lastVaccinatedDate: '',
  NIDFront: '',
  NIDBack: '',
  phoneNumbers: [],
  preferredDonationLocations: []
}

export const useProfile = (): { userDetails: UserProfileDetails } => {
  const { userProfile } = useUserProfile()
  //   const [userDetails, setUserDetails] = useState(userProfile)
  const normalizeProfile = (profile: UserProfile): UserProfile => ({
    ...defaultProfile,
    ...profile,
    name: profile.name ?? '',
    gender: (['male', 'female', 'other'].includes(profile.gender)
      ? profile.gender
      : 'Other') as Gender
  })

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

  const normalizedProfile = normalizeProfile(userProfile)

  const enhancedUserDetails = useMemo(() => ({
    ...normalizedProfile,
    age: calculateAge(normalizedProfile.dateOfBirth),
    location: getLocation(normalizedProfile.preferredDonationLocations)
  }), [normalizedProfile])

  return {
    userDetails: enhancedUserDetails
  }
}
