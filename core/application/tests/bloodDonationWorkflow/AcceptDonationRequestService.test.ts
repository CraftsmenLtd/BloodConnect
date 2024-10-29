import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'
import AcceptDonationRequestError from '../../../application/bloodDonationWorkflow/AcceptDonationRequestError'
import { AcceptedDonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import { acceptDonationRequestAttributesMock } from '../../tests/mocks/mockDonationAcceptanceData'

jest.mock('../../technicalImpl/policies/repositories/Repository')

const mockAcceptDonationRepository = {
  create: jest.fn(),
  update: jest.fn(),
  getItem: jest.fn()
}
const acceptDonationService = new AcceptDonationService()

describe('AcceptDonationService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should accept a donation request successfully when status is pending and no acceptance exists', async () => {
    const mockQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.PENDING
    }

    // First call: check the donation request (pending)
    // Second call: check for existing ACCEPTED entry (none found)
    mockAcceptDonationRepository.getItem
      .mockResolvedValueOnce(mockQueryResult) // Donation request found with PENDING status
      .mockResolvedValueOnce(null) // No existing ACCEPTED entry

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('Donation request accepted successfully.')
    expect(mockAcceptDonationRepository.create).toHaveBeenCalledWith({
      donorId: acceptDonationRequestAttributesMock.donorId,
      seekerId: acceptDonationRequestAttributesMock.seekerId,
      createdAt: acceptDonationRequestAttributesMock.createdAt,
      requestPostId: acceptDonationRequestAttributesMock.requestPostId,
      acceptanceTime: expect.any(String) // acceptanceTime should be a valid date string
    })
  })

  it('should return "The request is complete" if the same donor tries to accept the request again', async () => {
    const mockAcceptedQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.COMPLETED // Entry indicating that the request has been accepted
    }

    // First call: check for existing ACCEPTED entry (found)
    mockAcceptDonationRepository.getItem.mockResolvedValueOnce(mockAcceptedQueryResult)

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('The request is complete')
    expect(mockAcceptDonationRepository.create).not.toHaveBeenCalled()
  })

  it('should return an error message when donation request is no longer available for acceptance', async () => {
    const mockQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.COMPLETED
    }

    // First call: check the donation request (completed)
    // Second call: check for existing ACCEPTED entry (none found)
    mockAcceptDonationRepository.getItem
      .mockResolvedValueOnce(mockQueryResult) // Donation request found with COMPLETED status
      .mockResolvedValueOnce(null) // No existing ACCEPTED entry

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('Donation request is no longer available for acceptance.')
    expect(mockAcceptDonationRepository.create).not.toHaveBeenCalled()
  })

  it('should return an error message when the donation request cannot be found', async () => {
    // First call: check the donation request (not found)
    mockAcceptDonationRepository.getItem.mockResolvedValueOnce(null)

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('Cannot find the donation request')
    expect(mockAcceptDonationRepository.create).not.toHaveBeenCalled()
  })

  it('should throw an AcceptDonationRequestError when an error occurs', async () => {
    const mockError = new Error('Database error')
    mockAcceptDonationRepository.getItem.mockRejectedValue(mockError)

    await expect(
      acceptDonationService.createAcceptanceRecord(acceptDonationRequestAttributesMock, mockAcceptDonationRepository)
    ).rejects.toThrow(new AcceptDonationRequestError(`Failed to accept donation request. Error: ${mockError}`, GENERIC_CODES.ERROR))
  })
})
