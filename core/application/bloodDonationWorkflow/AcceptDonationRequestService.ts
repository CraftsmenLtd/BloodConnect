import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import AcceptDonationRequestError from './AcceptDonationRequestError'
import type { AcceptDonationRequestAttributes } from './Types'
import type AcceptedDonationRepository from '../models/policies/repositories/AcceptedDonationRepository'
import type { AcceptDonationStatus, AcceptedDonationDTO } from '../../../commons/dto/DonationDTO'

export class AcceptDonationService {
  async createAcceptanceRecord(
    acceptDonationRequestAttributes: AcceptDonationRequestAttributes,
    acceptDonationRequestRepository: AcceptedDonationRepository<AcceptedDonationDTO>
  ): Promise<void> {
    const acceptanceRecord: AcceptedDonationDTO = {
      ...acceptDonationRequestAttributes,
      acceptanceTime: new Date().toISOString()
    }
    await acceptDonationRequestRepository.create(acceptanceRecord).catch(() => {
      throw new AcceptDonationRequestError('Failed to accept donation request', GENERIC_CODES.ERROR)
    })
  }

  async updateAcceptanceRecord(
    acceptDonationRequestAttributes: AcceptDonationRequestAttributes,
    acceptDonationRequestRepository: AcceptedDonationRepository<AcceptedDonationDTO>
  ): Promise<void> {
    await acceptDonationRequestRepository.update(acceptDonationRequestAttributes).catch(() => {
      throw new AcceptDonationRequestError(
        'Failed to update accept donation request',
        GENERIC_CODES.ERROR
      )
    })
  }

  async updateAcceptanceRecordStatus(
    seekerId: string,
    requestPostId: string,
    donorId: string,
    status: AcceptDonationStatus,
    acceptDonationRequestRepository: AcceptedDonationRepository<AcceptedDonationDTO>
  ): Promise<void> {
    const updateData: Partial<AcceptedDonationDTO> = {
      seekerId,
      requestPostId,
      donorId,
      status
    }
    await acceptDonationRequestRepository.update(updateData).catch(() => {
      throw new AcceptDonationRequestError(
        'Failed to update accept donation request',
        GENERIC_CODES.ERROR
      )
    })
  }

  async getAcceptanceRecord(
    seekerId: string,
    requestPostId: string,
    donorId: string,
    acceptDonationRepository: AcceptedDonationRepository<AcceptedDonationDTO>
  ): Promise<AcceptedDonationDTO | null> {
    const item = await acceptDonationRepository.getAcceptedRequest(seekerId, requestPostId, donorId)
    return item
  }

  async getAcceptedDonorList(
    seekerId: string,
    requestPostId: string,
    acceptDonationRepository: AcceptedDonationRepository<AcceptedDonationDTO>
  ): Promise<AcceptedDonationDTO[]> {
    const queryResult = await acceptDonationRepository.queryAcceptedRequests(
      seekerId,
      requestPostId
    )
    return queryResult ?? []
  }

  async deleteAcceptedRequest(
    seekerId: string,
    requestPostId: string,
    donorId: string,
    acceptDonationRepository: AcceptedDonationRepository<AcceptedDonationDTO>
  ): Promise<void> {
    await acceptDonationRepository.deleteAcceptedRequest(seekerId, requestPostId, donorId)
  }
}
