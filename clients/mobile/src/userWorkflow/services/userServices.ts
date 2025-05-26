import type { HttpClient } from '../../setup/clients/HttpClient'
import type { ApiResponse } from '../../setup/clients/response'

export type preferredDonationLocations = { area: string }

export type DonorProfile = {
  phoneNumbers?: string[];
  donorName?: string;
  bloodGroup?: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
  preferredDonationLocations?: preferredDonationLocations[];
}

export const getDonorProfile = async(donorId: string, httpClient: HttpClient): Promise<ApiResponse<DonorProfile>> => {
  try {
    const response = await httpClient.get<ApiResponse<DonorProfile>>(`/donors/${donorId}`, {})
    return {
      message: response.message,
      status: response.status,
      data: response.data
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}
