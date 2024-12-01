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

// --------------------------------------------------------------------------

// import { HttpClient } from '../../setup/clients/HttpClient'
// import { ProfileError } from '../../utility/errors'

// export interface UserProfile {
//   bloodGroup?: string;
//   name?: string;
//   lastDonationDate?: string;
//   height?: number;
//   weight?: number;
//   gender?: string;
//   dateOfBirth?: string;
//   availableForDonation?: string;
//   lastVaccinatedDate?: string;
//   NIDFront?: string;
//   NIDBack?: string;
//   phoneNumbers?: string[];
//   preferredDonationLocations?: Array<{
//     area: string;
//     city: string;
//     latitude: number;
//     longitude: number;
//   }>;
// }

// interface APIResponse {
//   success?: boolean;
//   data?: UserProfile;
//   message?: string;
//   status: number;
// }

// export const checkUserProfile = async(httpClient: HttpClient): Promise<UserProfile> => {
//   try {
//     const response = await httpClient.get<APIResponse>('/users')

//     if (response.status !== 200) {
//       throw new ProfileError(`Failed to get user profile data. Status: ${response.status}`)
//     }

//     if (!(response.success ?? false) || (response.data == null)) {
//       throw new ProfileError('Invalid response format from server')
//     }

//     return response.data
//   } catch (error) {
//     if (error instanceof ProfileError) {
//       throw error
//     }
//     throw new ProfileError(error instanceof Error ? error.message : 'Unknown error occurred')
//   }
// }

// --------------------------------------------------------------------------

// import { HttpClient } from '../../setup/clients/HttpClient'
// import { ProfileError } from '../../utility/errors'

// export interface UserProfile {
//   bloodGroup?: string;
//   name?: string;
//   lastDonationDate?: string;
//   height?: number;
//   weight?: number;
//   gender?: string;
//   dateOfBirth?: string;
//   availableForDonation?: string;
//   lastVaccinatedDate?: string;
//   NIDFront?: string;
//   NIDBack?: string;
//   phoneNumbers?: string[];
//   preferredDonationLocations?: Array<{
//     area: string;
//     city: string;
//     latitude: number;
//     longitude: number;
//   }>;
// }

// interface APIResponse {
//   success: boolean;
//   data: UserProfile;
//   message: string;
//   status?: number;
// }

// export const checkUserProfile = async(httpClient: HttpClient): Promise<UserProfile | null> => {
//   try {
//     const response = await httpClient.get<APIResponse>('/users')
//     if (typeof response === 'string') {
//       const parsedResponse = JSON.parse(response) as APIResponse
//       if (parsedResponse.success && parsedResponse.data !== null && parsedResponse.data !== undefined) {
//         return parsedResponse.data
//       }
//     } else if (response !== null && response !== undefined && typeof response === 'object') {
//       if (response.success && response.data !== null && response.data !== undefined) {
//         return response.data
//       }
//     }

//     throw new ProfileError('Failed to get user profile data')
//   } catch (error) {
//     if (error instanceof ProfileError) {
//       throw error
//     }
//     throw new ProfileError(error instanceof Error ? error.message : 'Unknown error occurred')
//   }
// }
