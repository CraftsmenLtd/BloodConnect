import { FetchClientError } from '../setup/clients/FetchClientError'
import { HttpClient } from '../setup/clients/HttpClient'

interface DonationResponse {
  message: string;
  status: number;
}

export const createDonation = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.post<DonationResponse>('/api/donations', payload)
    return {
      message: response.data.message,
      status: response.status
    }
  } catch (error) {
    const status = error instanceof FetchClientError ? error.status : 500
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new FetchClientError(errorMessage, status)
  }
}
