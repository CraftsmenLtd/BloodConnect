import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { useUserProfile } from '../context/UserProfileContext'
import { requestProfilePictureUploadUrl, updateUserProfile } from '../services/userProfileService'

type UseProfilePictureUploadOutput = {
  uploading: boolean;
  error: string;
  pickAndUpload: () => Promise<void>;
}

export const useProfilePictureUpload = (): UseProfilePictureUploadOutput => {
  const fetchClient = useFetchClient()
  const { updateUserProfileContext } = useUserProfile()
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const pickAndUpload = async(): Promise<void> => {
    setError('')
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError('Permission to access photos is required.')

      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    })
    if (result.canceled || result.assets.length === 0) {
      return
    }

    const asset = result.assets[0]
    const contentType = asset.mimeType ?? 'image/jpeg'
    setUploading(true)
    try {
      const { uploadUrl, fileUrl } = await requestProfilePictureUploadUrl(fetchClient, contentType)
      const fileResponse = await fetch(asset.uri)
      const blob = await fileResponse.blob()
      const putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': contentType }
      })
      if (!putResponse.ok) {
        throw new Error('Failed to upload image.')
      }

      // Version the stored URL so a replacement bypasses any cached CloudFront/image response.
      const versionedUrl = `${fileUrl}?v=${Date.now()}`
      await updateUserProfile({ profilePicture: versionedUrl }, fetchClient)
      await updateUserProfileContext({ profilePicture: versionedUrl })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  return { uploading, error, pickAndUpload }
}
