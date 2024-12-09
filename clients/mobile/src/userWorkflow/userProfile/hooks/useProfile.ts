import { useState, useMemo } from 'react'
import { User } from '../../account/hooks/useAccount'
import { UserDetailsDTO } from '../../../../../../commons/dto/UserDTO'
import { useUserProfile } from '../../context/UserProfileContext'

const [userProfileData, setUserProfileData] = useState<User | null>(null)

type Gender = 'male' | 'female' | 'other'

export interface UserProfile {
  bloodGroup: string;
  name: string;
  lastDonationDate: string;
  height: number;
  weight: number;
  gender: Gender; // Ensure this matches UserProfileDetails
  dateOfBirth: string;
  availableForDonation: string;
  lastVaccinatedDate: string;
  NIDFront: string;
  NIDBack: string;
  phoneNumbers: string[];
  preferredDonationLocations: string[];
}

export interface UserProfileDetails extends UserProfile {
  age: number;
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
    gender: (['male', 'female', 'other'].includes(profile.gender)
      ? profile.gender
      : 'Other') as Gender
  })

  const normalizedProfile = normalizeProfile(userProfile)

  const getProfileLocation = (preferredDonationLocations: string | any[]): string => {
    if (preferredDonationLocations.length > 0) {
      const { city = '', area = '' } = preferredDonationLocations[0]
      const location = `${city}, ${area}`
      setUserData({ name, location })
    } else {
      const location = ''
      setUserData({ name, location })
    }
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

  const enhancedUserDetails = useMemo(() => ({
    ...normalizedProfile,
    age: calculateAge(normalizedProfile.dateOfBirth)
  }), [normalizedProfile])

  return {
    userDetails: enhancedUserDetails
  }
}
