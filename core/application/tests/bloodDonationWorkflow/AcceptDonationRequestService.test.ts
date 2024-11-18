import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'
import AcceptDonationRequestError from '../../../application/bloodDonationWorkflow/AcceptDonationRequestError'
import { AcceptedDonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import { acceptDonationRequestAttributesMock } from '../../tests/mocks/mockDonationAcceptanceData'

jest.mock('../../models/policies/repositories/Repository')

const mockAcceptDonationRepository = {
  create: jest.fn(),
  update: jest.fn(),
  getItem: jest.fn(),
  query: jest.fn(),
  delete: jest.fn()
}
const acceptDonationService = new AcceptDonationService()

describe('AcceptDonationService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return "The request is complete" if the acceptance record already exists (ConditionalCheckFailedException)', async() => {
    const mockQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.PENDING
    }

    mockAcceptDonationRepository.getItem.mockResolvedValueOnce(mockQueryResult)
    mockAcceptDonationRepository.create.mockRejectedValueOnce({ code: 'ConditionalCheckFailedException' })

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('The request is complete')
    expect(mockAcceptDonationRepository.create).toHaveBeenCalled()
  })

  it('should return "Donation request is no longer available for acceptance" when the request is not pending', async() => {
    const mockQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.COMPLETED
    }

    mockAcceptDonationRepository.getItem.mockResolvedValueOnce(mockQueryResult)

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockAcceptDonationRepository
    )

    expect(result).toBe('Donation request is no longer available for acceptance.')
    expect(mockAcceptDonationRepository.create).not.toHaveBeenCalled()
  })

  it('should return "Cannot find the donation request" if the donation request cannot be found', async() => {
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
    mockAcceptDonationRepository.getItem.mockRejectedValueOnce(mockError)

    await expect(
      acceptDonationService.createAcceptanceRecord(acceptDonationRequestAttributesMock, mockAcceptDonationRepository)
    ).rejects.toThrow(new AcceptDonationRequestError(`Failed to accept donation request. Error: ${mockError}`, GENERIC_CODES.ERROR))
  })
})
