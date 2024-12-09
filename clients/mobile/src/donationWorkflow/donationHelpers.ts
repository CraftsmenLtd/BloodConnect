import { BloodDonationRecord } from './types'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

export const parseErrorMessage = (message: string): string | null => {
  try {
    const parsedError = JSON.parse(message)
    return parsedError !== null && typeof parsedError.message === 'string' ? parsedError.message : null
  } catch {
    return null
  }
}

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message
    const parsedMessage = parseErrorMessage(message)
    if (parsedMessage !== null) return parsedMessage
  }

  if (typeof error === 'string') {
    const parsedMessage = parseErrorMessage(error)
    if (parsedMessage !== null) return parsedMessage
  }

  return 'An unknown error occurred'
}

export const formatBloodQuantity = (bloodQuantity: string): string => {
  if (bloodQuantity !== '') {
    const quantity = +bloodQuantity
    return quantity === 1 ? `${quantity} Bag` : `${quantity} Bags`
  }
  return ''
}

export const formatDonations = (requests: BloodDonationRecord[]): DonationData[] => {
  return requests.map(request => ({
    requestPostId: request.reqPostId ?? '',
    patientName: request.patientName ?? '',
    requestedBloodGroup: request.requestedBloodGroup ?? '',
    bloodQuantity: formatBloodQuantity(request.bloodQuantity),
    urgencyLevel: request.urgencyLevel ?? '',
    location: request.location ?? '',
    donationDateTime: request.donationDateTime ?? new Date().toISOString(),
    contactNumber: request.contactNumber ?? '',
    transportationInfo: request.transportationInfo ?? '',
    shortDescription: request.shortDescription ?? '',
    city: request.city ?? '',
    createdAt: request.createdAt ?? new Date().toISOString(),
    acceptedDonors: request.acceptedDonors ?? []
  }))
}
