import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { useUserProfile } from '../context/UserProfileContext'
import { requestProfilePictureUploadUrl, updateUserProfile } from '../services/userProfileService'

type UseProfilePictureUploadOutput = {
  uploading: boolean;
  error: string;
  pickAndUpload: () => Promise<void>;
}

// Every upload is re-encoded to JPEG, so the signed Content-Type is a constant. It has to match
// the header sent on the PUT exactly — it is part of SignedHeaders — and deriving it from the
// picked asset invited a mismatch.
const UPLOAD_CONTENT_TYPE = 'image/jpeg'
const MAX_IMAGE_DIMENSION = 1024
const JPEG_COMPRESSION = 0.8

export const useProfilePictureUpload = (): UseProfilePictureUploadOutput => {
  const fetchClient = useFetchClient()
  const { updateUserProfileContext } = useUserProfile()
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const pickAndUpload = async(): Promise<void> => {
    setError('')
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError('error.photoPermissionDenied')

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
    setUploading(true)
    try {
      // Downscale before upload: a presigned SigV4 PUT cannot express content-length-range, so
      // the only size bound available is the one applied here. Skipped when already small enough
      // so we never upscale.
      const context = ImageManipulator.manipulate(asset.uri)
      if (asset.width > MAX_IMAGE_DIMENSION) {
        context.resize({ width: MAX_IMAGE_DIMENSION })
      }
      const rendered = await context.renderAsync()
      const { uri: localUri } = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: JPEG_COMPRESSION
      })

      const { uploadUrl, fileUrl } = await requestProfilePictureUploadUrl(
        fetchClient,
        UPLOAD_CONTENT_TYPE
      )

      // uploadAsync streams the file natively. fetch(file://).blob() uploads zero bytes on
      // Android, which S3 accepts happily and then serves as a blank image.
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, localUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': UPLOAD_CONTENT_TYPE }
      })
      // uploadAsync resolves on non-2xx rather than throwing, so the status needs checking.
      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error('error.imageUploadFailed')
      }

      // Version the stored URL so a replacement bypasses any cached CloudFront/image response.
      const versionedUrl = `${fileUrl}?v=${Date.now()}`
      await updateUserProfile({ profilePicture: versionedUrl }, fetchClient)
      await updateUserProfileContext({ profilePicture: versionedUrl })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'error.imageUploadFailed')
    } finally {
      setUploading(false)
    }
  }

  return { uploading, error, pickAndUpload }
}
