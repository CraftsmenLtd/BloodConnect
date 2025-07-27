import { parseJsonData } from '../utility/jsonParser'
import type { BloodDonationRecord } from './types'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

export const parseErrorMessage = (message: string): string | null => {
  try {
    const parsedError = parseJsonData<{ message: string }>(message)

    return parsedError !== null && typeof parsedError.message === 'string' ? parsedError.message : null
  } catch (error) {
    return null
  }
}

export const extractErrorMessage = (error: unknown): string => {
  try {
    if (error instanceof Error) {
      const parsedMessage = parseErrorMessage(error.message)
      if (parsedMessage !== null) return parsedMessage

      return error.message
    }

    if (typeof error === 'string') {
      const parsedMessage = parseErrorMessage(error)
      if (parsedMessage !== null) return parsedMessage

      return error
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message: string }).message
      const parsedMessage = parseErrorMessage(message)
      if (parsedMessage !== null) return parsedMessage

      return message
    }

    return 'An unknown error occurred'
  } catch (e) {
    return 'An unknown error occurred'
  }
}

export const formatBloodQuantity = (bloodQuantity: string): string => {
  if (bloodQuantity !== '') {
    const quantity = +bloodQuantity

    return quantity === 1 ? `${quantity} Bag` : `${quantity} Bags`
  }

  return ''
}

export const formatDonations = (requests: BloodDonationRecord[], name?: string): DonationData[] => requests.map((request) => ({
  requestPostId: request.requestPostId ?? '',
  seekerId: request.seekerId ?? '',
  seekerName: request.seekerName ?? name ?? '',
  patientName: request.patientName ?? name ?? '',
  requestedBloodGroup: request.requestedBloodGroup ?? '',
  bloodQuantity: request.bloodQuantity,
  urgencyLevel: request.urgencyLevel ?? '',
  location: request.location ?? '',
  donationDateTime: request.donationDateTime ?? new Date().toISOString(),
  contactNumber: request.contactNumber ?? '',
  transportationInfo: request.transportationInfo ?? '',
  shortDescription: request.shortDescription ?? '',
  status: request.status ?? '',
  createdAt: request.createdAt ?? new Date().toISOString(),
  acceptedDonors: request.acceptedDonors ?? []
}))
