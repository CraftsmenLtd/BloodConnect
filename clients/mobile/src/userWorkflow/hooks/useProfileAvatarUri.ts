import { useEffect, useState } from 'react'
import { getIdTokenPicture } from '../../authentication/services/authService'
import { useUserProfile } from '../context/UserProfileContext'

// Resolves the avatar to display, following precedence:
// persisted upload (profilePicture) > Google account photo (idToken claim) > undefined (initials fallback).
export const useProfileAvatarUri = (): string | undefined => {
  const { userProfile } = useUserProfile()
  const [googlePicture, setGooglePicture] = useState<string | undefined>(undefined)

  useEffect(() => {
    let active = true
    void getIdTokenPicture().then((picture) => {
      if (active) setGooglePicture(picture)
    })

    return () => { active = false }
  }, [])

  const persisted = userProfile.profilePicture
  if (persisted !== undefined && persisted !== '') return persisted
  if (googlePicture !== undefined && googlePicture !== '') return googlePicture

  return undefined
}
