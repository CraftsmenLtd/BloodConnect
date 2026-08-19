import { renderHook, act, waitFor } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'
import { useProfilePictureUpload } from '../../src/userWorkflow/hooks/useProfilePictureUpload'
import {
  requestProfilePictureUploadUrl,
  updateUserProfile
} from '../../src/userWorkflow/services/userProfileService'

jest.mock('../../src/userWorkflow/services/userProfileService')
jest.mock('../../src/setup/clients/useFetchClient', () => ({
  useFetchClient: () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() })
}))

const mockUpdateUserProfileContext = jest.fn()
jest.mock('../../src/userWorkflow/context/UserProfileContext', () => ({
  useUserProfile: () => ({ updateUserProfileContext: mockUpdateUserProfileContext })
}))

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn()
}))

const mockResize = jest.fn()
const mockSaveAsync = jest.fn()
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' }
}))

jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: { BINARY_CONTENT: 'BINARY_CONTENT' }
}))

const mockedPicker = ImagePicker as jest.Mocked<typeof ImagePicker>
const mockedManipulate = ImageManipulator.manipulate as jest.Mock
const mockedUploadAsync = FileSystem.uploadAsync as jest.MockedFunction<typeof FileSystem.uploadAsync>
const mockedRequestUploadUrl
  = requestProfilePictureUploadUrl as jest.MockedFunction<typeof requestProfilePictureUploadUrl>
const mockedUpdateUserProfile
  = updateUserProfile as jest.MockedFunction<typeof updateUserProfile>

const grantPermission = (granted: boolean) => {
  mockedPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue(
    { granted } as unknown as ImagePicker.MediaLibraryPermissionResponse
  )
}

const pickImage = (width: number) => {
  mockedPicker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///tmp/original.heic', width, height: width }]
  } as unknown as ImagePicker.ImagePickerResult)
}

describe('useProfilePictureUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockSaveAsync.mockResolvedValue({ uri: 'file:///tmp/resized.jpg' })
    mockedManipulate.mockReturnValue({
      resize: mockResize,
      renderAsync: jest.fn().mockResolvedValue({ saveAsync: mockSaveAsync })
    })
    mockedUploadAsync.mockResolvedValue(
      { status: 200 } as unknown as FileSystem.FileSystemUploadResult
    )
    mockedRequestUploadUrl.mockResolvedValue({
      uploadUrl: 'https://s3.example/put',
      fileUrl: 'https://cdn.example/media/user-images/12345/profile'
    })
    mockedUpdateUserProfile.mockResolvedValue({ message: 'ok', status: 200 })

    grantPermission(true)
    pickImage(2048)
  })

  test('should set the permission error and not request an upload url when access is denied', async() => {
    grantPermission(false)

    const { result } = renderHook(() => useProfilePictureUpload())
    await act(async() => { await result.current.pickAndUpload() })

    expect(result.current.error).toBe('error.photoPermissionDenied')
    expect(mockedRequestUploadUrl).not.toHaveBeenCalled()
    expect(result.current.uploading).toBe(false)
  })

  test('should do nothing when the picker is cancelled', async() => {
    mockedPicker.launchImageLibraryAsync.mockResolvedValue(
      { canceled: true, assets: null } as unknown as ImagePicker.ImagePickerResult
    )

    const { result } = renderHook(() => useProfilePictureUpload())
    await act(async() => { await result.current.pickAndUpload() })

    expect(result.current.error).toBe('')
    expect(mockedRequestUploadUrl).not.toHaveBeenCalled()
    expect(mockedUploadAsync).not.toHaveBeenCalled()
  })

  test('should downscale, upload as binary and persist the versioned url', async() => {
    const { result } = renderHook(() => useProfilePictureUpload())
    await act(async() => { await result.current.pickAndUpload() })

    expect(mockedManipulate).toHaveBeenCalledWith('file:///tmp/original.heic')
    expect(mockResize).toHaveBeenCalledWith({ width: 1024 })
    expect(mockSaveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: 0.8 })

    // The signed Content-Type and the header sent on the PUT have to agree, or S3 rejects it.
    expect(mockedRequestUploadUrl).toHaveBeenCalledWith(expect.anything(), 'image/jpeg')
    expect(mockedUploadAsync).toHaveBeenCalledWith(
      'https://s3.example/put',
      'file:///tmp/resized.jpg',
      {
        httpMethod: 'PUT',
        uploadType: 'BINARY_CONTENT',
        headers: { 'Content-Type': 'image/jpeg' }
      }
    )

    const [[payload]] = mockedUpdateUserProfile.mock.calls
    expect(payload.profilePicture).toMatch(
      /^https:\/\/cdn\.example\/media\/user-images\/12345\/profile\?v=\d+$/
    )
    expect(mockUpdateUserProfileContext).toHaveBeenCalledWith(payload)
    expect(result.current.error).toBe('')
  })

  test('should not resize an image already within the maximum dimension', async() => {
    pickImage(512)

    const { result } = renderHook(() => useProfilePictureUpload())
    await act(async() => { await result.current.pickAndUpload() })

    expect(mockResize).not.toHaveBeenCalled()
    // Still re-encoded to JPEG so the content type stays predictable.
    expect(mockSaveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: 0.8 })
    expect(result.current.error).toBe('')
  })

  test('should surface an error and skip the patch when S3 rejects the upload', async() => {
    mockedUploadAsync.mockResolvedValue(
      { status: 403 } as unknown as FileSystem.FileSystemUploadResult
    )

    const { result } = renderHook(() => useProfilePictureUpload())
    await act(async() => { await result.current.pickAndUpload() })

    expect(result.current.error).toBe('error.imageUploadFailed')
    expect(mockedUpdateUserProfile).not.toHaveBeenCalled()
    expect(mockUpdateUserProfileContext).not.toHaveBeenCalled()
  })

  test('should surface the message when requesting the upload url fails', async() => {
    mockedRequestUploadUrl.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProfilePictureUpload())
    await act(async() => { await result.current.pickAndUpload() })

    expect(result.current.error).toBe('Network error')
    expect(mockedUploadAsync).not.toHaveBeenCalled()
  })

  test('should surface the message and stop uploading when the patch fails', async() => {
    mockedUpdateUserProfile.mockRejectedValue(new Error('Failed to update profile'))

    const { result } = renderHook(() => useProfilePictureUpload())
    await act(async() => { await result.current.pickAndUpload() })

    await waitFor(() => { expect(result.current.uploading).toBe(false) })
    expect(result.current.error).toBe('Failed to update profile')
    expect(mockUpdateUserProfileContext).not.toHaveBeenCalled()
  })
})
