import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { AcceptedDonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import { acceptDonationRequestAttributesMock } from '../../tests/mocks/mockDonationAcceptanceData'
import Repository from '../../../application/models/policies/repositories/Repository'
import { mockRepository } from '../mocks/mockRepositories'
import { mockUserDetailsWithStringId } from '../mocks/mockUserData'

jest.mock('../../models/policies/repositories/Repository')

const acceptDonationService = new AcceptDonationService()

describe('AcceptDonationService', () => {
  const mockAcceptDonationRepository: jest.Mocked<Repository<AcceptedDonationDTO>> =
    mockRepository

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return "The request is complete" if the acceptance record already exists (ConditionalCheckFailedException)', async() => {
    const mockQueryResult: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributesMock,
      status: DonationStatus.PENDING,
      name: 'test name',
      phoneNumbers: []
    }

    mockAcceptDonationRepository.getItem.mockResolvedValueOnce(mockQueryResult)
    mockAcceptDonationRepository.create.mockRejectedValueOnce({ code: 'ConditionalCheckFailedException' })

    const result = await acceptDonationService.createAcceptanceRecord(
      acceptDonationRequestAttributesMock,
      mockUserDetailsWithStringId,
      mockAcceptDonationRepository
    )
    expect(result).toBe('The request is complete')
    expect(mockAcceptDonationRepository.create).toHaveBeenCalled()
  })
})
