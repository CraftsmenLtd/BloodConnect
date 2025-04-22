import type { AcceptDonationDTO } from 'commons/dto/DonationDTO';
import type Repository from './Repository'

type AcceptDonationRepository = {
  queryAcceptedRequests(seekerId: string, requestPostId: string): Promise<AcceptDonationDTO[] | null>;
  getAcceptedRequest(seekerId: string, requestPostId: string, donorId: string): Promise<AcceptDonationDTO | null>;
  deleteAcceptedRequest(seekerId: string, requestPostId: string, donorId: string): Promise<void>;
} & Repository<AcceptDonationDTO, Record<string, unknown>>
export default AcceptDonationRepository
