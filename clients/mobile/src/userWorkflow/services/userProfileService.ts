import { HttpClient } from '../../setup/clients/HttpClient'
import { ProfileError } from '../../utility/errors'

export interface UserProfile {
  bloodGroup?: string;
  name?: string;
  lastDonationDate?: string;
  height?: number;
  weight?: number;
  gender?: string;
  dateOfBirth?: string;
  availableForDonation?: string;
  lastVaccinatedDate?: string;
  NIDFront?: string;
  NIDBack?: string;
  phoneNumbers?: string[];
  preferredDonationLocations?: Array<{
    area: string;
    city: string;
    latitude: number;
    longitude: number;
  }>;
}

interface APIResponse {
  success?: boolean;
  data?: UserProfile;
  message?: string;
  status: number;
}

export const checkUserProfile = async(httpClient: HttpClient): Promise<APIResponse> => {
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
