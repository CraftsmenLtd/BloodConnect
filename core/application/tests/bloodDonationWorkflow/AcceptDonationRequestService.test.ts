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

  it('should accept a donation request successfully when status is pending and no acceptance exists', async() => {
    const mockQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.PENDING
    }

    mockAcceptDonationRepository.getItem
      .mockResolvedValueOnce(mockQueryResult)
      .mockResolvedValueOnce(null)

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
      acceptanceTime: expect.any(String)
    })
  })

  it('should return "The request is complete" if the same donor tries to accept the request again', async() => {
    const mockAcceptedQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.COMPLETED
    }

    mockAcceptDonationRepository.getItem.mockResolvedValueOnce(mockAcceptedQueryResult)

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('The request is complete')
    expect(mockAcceptDonationRepository.create).not.toHaveBeenCalled()
  })

  it('should return an error message when donation request is no longer available for acceptance', async() => {
    const mockQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.COMPLETED
    }

    mockAcceptDonationRepository.getItem
      .mockResolvedValueOnce(mockQueryResult)
      .mockResolvedValueOnce(null)

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('Donation request is no longer available for acceptance.')
    expect(mockAcceptDonationRepository.create).not.toHaveBeenCalled()
  })

  it('should return an error message when the donation request cannot be found', async() => {
    mockAcceptDonationRepository.getItem.mockResolvedValueOnce(null)

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('Cannot find the donation request')
    expect(mockAcceptDonationRepository.create).not.toHaveBeenCalled()
  })

  it('should throw an AcceptDonationRequestError when an error occurs', async() => {
    const mockError = new Error('Database error')
    mockAcceptDonationRepository.getItem.mockRejectedValue(mockError)

    await expect(
      acceptDonationService.createAcceptanceRecord(acceptDonationRequestAttributesMock, mockAcceptDonationRepository)
    ).rejects.toThrow(new AcceptDonationRequestError(`Failed to accept donation request. Error: ${mockError}`, GENERIC_CODES.ERROR))
  })
})
