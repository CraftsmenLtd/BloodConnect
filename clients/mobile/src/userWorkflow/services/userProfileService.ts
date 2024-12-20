import { HttpClient } from '../../setup/clients/HttpClient'
import { ProfileError } from '../../utility/errors'
import { UserDetailsDTO } from '../../../../../commons/dto/UserDTO'

interface UserPreferedLocation {
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface UserProfile extends Partial<Omit<UserDetailsDTO, 'createdAt' | 'updatedAt' | 'deviceToken' | 'snsEndpointArn' | 'bloodGroup' | 'gender' | 'availableForDonation'>> {
  preferredDonationLocations?: UserPreferedLocation[];
  city: string;
  bloodGroup: string;
  gender: string;
  availableForDonation: string;
}

interface APIResponse {
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
