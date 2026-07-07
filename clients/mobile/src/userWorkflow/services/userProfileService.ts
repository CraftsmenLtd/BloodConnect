import type { HttpClient } from '../../setup/clients/HttpClient'
import { ProfileError } from '../../utility/errors'
import type { UserDetailsDTO } from '../../../../../commons/dto/UserDTO'

type UserPreferredLocation = {
  area: string;
  h3Res8?: string;
  h3Res10?: string;
  latitude: number;
  longitude: number;
}

export type UserProfile = {
  preferredDonationLocations?: UserPreferredLocation[];
  locations: string[];
  userId: string;
  bloodGroup: string;
  gender: string;
  availableForDonation: boolean;
} & Partial<Omit<UserDetailsDTO,
  'createdAt'
  | 'updatedAt'
  | 'deviceToken'
  | 'snsEndpointArn'
  | 'bloodGroup'
  | 'gender'
  | 'availableForDonation'>>

type APIResponse = {
  success?: boolean;
  data?: UserProfile;
  message?: string;
  status: number;
}

export const fetchUserProfileFromApi = async(httpClient: HttpClient): Promise<APIResponse> => {
  try {
    const response = await httpClient.get<APIResponse>('/users')

    return {
      data: response.data,
      status: response.status
    }
  } catch (error) {
    if (error instanceof ProfileError) {
      throw error
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new ProfileError(errorMessage)
  }
}

export const createUserProfile = async(payload: Record<string, unknown>, httpClient: HttpClient):
Promise<APIResponse> => {
  try {
    const response = await httpClient.post<APIResponse>('/users', payload)

    return {
      message: response.message,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(errorMessage)
  }
}

type UploadUrlResponse = {
  uploadUrl: string;
  fileUrl: string;
}

export const requestProfilePictureUploadUrl = async(
  httpClient: HttpClient,
  contentType: string
): Promise<UploadUrlResponse> => {
  try {
    const response = await httpClient.post<UploadUrlResponse>(
      '/users/profile-picture-upload-url',
      { contentType }
    )

    return { uploadUrl: response.uploadUrl, fileUrl: response.fileUrl }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(errorMessage)
  }
}

export const updateUserProfile = async(payload: Record<string, unknown>, httpClient: HttpClient):
Promise<APIResponse> => {
  try {
    const response = await httpClient.patch<APIResponse>('/users', payload)

    return {
      message: response.message,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(errorMessage)
  }
}
