import type { DonationResponse } from '../../src/donationWorkflow/donationService'
import { createDonation, updateDonation, fetchDonationList } from '../../src/donationWorkflow/donationService'
import type { BloodDonationRecord } from '../../src/donationWorkflow/types'
import type { FetchResponse } from '../../src/setup/clients/FetchClient'
import { FetchClientError } from '../../src/setup/clients/FetchClientError'

jest.mock('../../src/setup/clients/FetchClient')

const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn()
}

const payload = { field1: 'value1' }

describe('Donation Service', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createDonation', () => {
    it('should return response with message and status on success', async() => {
      const mockResponse: FetchResponse<DonationResponse> = { message: 'Donation created', status: 201 }
      mockHttpClient.post.mockResolvedValueOnce(mockResponse)

      const result = await createDonation(payload, mockHttpClient)

      expect(mockHttpClient.post).toHaveBeenCalledWith('/donations', payload)
      expect(result).toEqual({ message: 'Donation created', status: 201 })
    })

    it('should throw an error on failure', async() => {
      mockHttpClient.post.mockRejectedValueOnce(new FetchClientError('Network Error', 500))

      await expect(createDonation(payload, mockHttpClient)).rejects.toThrow('Network Error')
    })
  })

  describe('updateDonation', () => {
    it('should return response with message and status on success', async() => {
      const mockResponse: FetchResponse<DonationResponse> = { message: 'Donation updated', status: 200 }
      mockHttpClient.patch.mockResolvedValueOnce(mockResponse)

      const result = await updateDonation(payload, mockHttpClient)

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/donations', payload)
      expect(result).toEqual({ message: 'Donation updated', status: 200 })
    })

    it('should throw an error on failure', async() => {
      mockHttpClient.patch.mockRejectedValueOnce(new FetchClientError('Update Error', 400))

      await expect(updateDonation(payload, mockHttpClient)).rejects.toThrow('Update Error')
    })
  })

  describe('fetchDonationList', () => {
    it('should return data and status on success', async() => {
      const mockData: BloodDonationRecord[] = [{
        patientName: 'John Doe',
        requestedBloodGroup: 'O-',
        location: 'Baridhara, Dhaka',
        donationDateTime: '2024-10-28T15:30:00Z',
        contactNumber: '+880123456789',
        urgencyLevel: 'urgent',
        bloodQuantity: '2 Bags',
        transportationInfo: 'Car available',
        shortDescription: 'Need blood urgently for surgery.',
        latitude: 23.7936,
        longitude: 90.4043,
        seekerId: 'seeker-123',
        acceptedDonors: [],
        status: 'ACCEPTED', // or another valid StatusType value
        requestPostId: 'post-456',
        createdAt: '2024-10-27T12:00:00Z'
      }]

      const mockResponse: FetchResponse<DonationResponse> = { data: mockData, status: 200 }
      mockHttpClient.get.mockResolvedValueOnce(mockResponse)

      const result = await fetchDonationList(payload, mockHttpClient)

      expect(mockHttpClient.get).toHaveBeenCalledWith('/donations', payload)
      expect(result).toEqual({ data: mockData, status: 200 })
    })

    it('should throw an error on failure', async() => {
      mockHttpClient.get.mockRejectedValueOnce(new FetchClientError('Fetch Error', 500))

      await expect(fetchDonationList(payload, mockHttpClient)).rejects.toThrow('Fetch Error')
    })
  })
})
