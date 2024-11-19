import { BloodDonationRecord } from './types'
import { useFetchClient } from '../setup/clients/useFetchClient'
import { getDonationList } from './donationService'

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

export const formatBloodQuantity = (bloodQuantity: string | null | undefined): string => {
  if (bloodQuantity !== '' && bloodQuantity !== null && bloodQuantity !== undefined) {
    const quantity = +bloodQuantity
    return quantity === 1 ? `${quantity} Bag` : `${quantity} Bags`
  }
  return ''
}

export const formatDonations = (requests: BloodDonationRecord[]): DonationData[] => {
  return requests.map(request => ({
    requestPostId: request.reqPostId ?? '',
    patientName: request.patientName ?? '',
    neededBloodGroup: request.neededBloodGroup ?? '',
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

export const fetchData = async(fetchClient: ReturnType<typeof useFetchClient>, setDonationPosts: (data: DonationData[]) => void, setErrorMessage: (message: string) => void, setLoading: (loading: boolean) => void): Promise<void> => {
  setLoading(true)
  try {
    const response = await getDonationList({}, fetchClient)
    if (response.data !== undefined && response.data.length > 0) {
      const formattedDonations = formatDonations(response.data)
      setDonationPosts(formattedDonations)
    } else {
      setDonationPosts([])
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error)
    setErrorMessage(errorMessage)
  } finally {
    setLoading(false)
  }
}
