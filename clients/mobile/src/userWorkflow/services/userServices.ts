import { HttpClient } from '../../setup/clients/HttpClient'

export interface DonationResponse<T = undefined> {
  success?: boolean;
  message?: string;
  status?: number;
  data?: T;
}

export type preferredDonationLocations = { area: string; city: string }

export interface DonorProfile {
  phoneNumbers: string[];
  donorName: string;
  bloodGroup: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  preferredDonationLocations: preferredDonationLocations[];
}

export const addPersonalInfoHandler = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.patch<DonationResponse>('/users', payload)
    return {
      message: response.message,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const getDonarProfile = async(donarId: string, httpClient: HttpClient): Promise<DonationResponse<DonorProfile>> => {
  try {
    const response = await httpClient.get<DonationResponse<DonorProfile>>(`/donors/${donarId}`, {})
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
