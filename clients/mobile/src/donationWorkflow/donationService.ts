import { HttpClient } from '../setup/clients/HttpClient'

export type BloodDonationRecord = {
  reqPostId: string;
  patientName: string;
  neededBloodGroup: string;
  bloodQuantity: string;
  urgencyLevel: string;
  location: string;
  latitude: number;
  longitude: number;
  donationDateTime: string;
  contactNumber: string;
  transportationInfo: string;
  shortDescription: string;
}

export interface DonationResponse {
  success?: boolean;
  data?: BloodDonationRecord[];
  message?: string;
  status?: number;
}

export const createDonation = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.post<DonationResponse>('/donations', payload)
    return {
      message: response.message,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const updateDonation = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.patch<DonationResponse>('/donations', payload)
    return {
      message: response.message,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const getDonationList = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.get<DonationResponse>('/donations', payload)
    return {
      data: response.data,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}
