import { HttpClient } from '../../setup/clients/HttpClient'

export interface DonationResponse {
  success?: boolean;
  message?: string;
  status?: number;
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
