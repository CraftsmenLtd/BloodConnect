import { HttpClient } from '../setup/clients/HttpClient'
import { ApiResponse } from '../setup/clients/response'
import { BloodDonationRecord } from './types'

export interface DonationResponse extends ApiResponse<BloodDonationRecord[]> {}
export interface DonationCreateUpdateResponse extends ApiResponse<{ requestPostId: string; createdAt: string }> {}

export const createDonation = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationCreateUpdateResponse> => {
  try {
    const response = await httpClient.post<DonationCreateUpdateResponse>('/donations', payload)
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

export const updateDonation = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationCreateUpdateResponse> => {
  try {
    const response = await httpClient.patch<DonationCreateUpdateResponse>('/donations', payload)
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

export const fetchDonationPublicPosts = async(city: string, httpClient: HttpClient, bloodGroup: string = ''): Promise<DonationResponse> => {
  try {
    const response = await httpClient.get<DonationResponse>(
      `/donations/posts/${city}`,
      { bloodGroup: (bloodGroup !== '') }
    )
    return {
      data: response.data,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const fetchDonationList = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
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

export const fetchSingleDonationPost = async(requestPostId: string, createdAt: string, httpClient: HttpClient): Promise<ApiResponse<BloodDonationRecord>> => {
  try {
    const response = await httpClient.get<ApiResponse<BloodDonationRecord>>(`/donations/${requestPostId}/${createdAt}`, {})
    return {
      data: response.data,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const completeDonation = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.post<DonationResponse>('/donations/complete', payload)
    return {
      data: response.data,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const fetchMyResponses = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.get<DonationResponse>('/donations/responses', payload)
    return {
      data: response.data,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const updateMyResponses = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.patch<DonationResponse>('/donations/responses', payload)
    return {
      data: response.data,
      status: response.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}

export const cancelDonation = async(payload: Record<string, unknown>, httpClient: HttpClient): Promise<DonationResponse> => {
  try {
    const response = await httpClient.patch<DonationResponse>('/donations/cancel', payload)
    return {
      message: response.message,
      status: response.status,
      success: response.success
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
    throw new Error(errorMessage)
  }
}
