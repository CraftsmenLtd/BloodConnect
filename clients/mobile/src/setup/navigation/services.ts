import type { HttpClient } from '../clients/HttpClient'
import type { ApiResponse } from '../clients/response'

interface CountryAvailabilityData {
  available: boolean;
  countryCode: string;
  countryName: string;
}

export const countryAvailability = async (payload: Record<string, unknown>, httpClient: HttpClient): Promise<ApiResponse<CountryAvailabilityData>> => {
  try {
    const response = await httpClient.get<ApiResponse<CountryAvailabilityData>>('/country-availability', payload)
    return {
      message: response.message,
      data: response.data,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}
