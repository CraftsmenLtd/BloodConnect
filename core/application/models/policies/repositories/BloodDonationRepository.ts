import type { DonationDTO } from 'commons/dto/DonationDTO'
import type Repository from './Repository'

type BloodDonationRepository = {
  getDonationRequest(seekerId: string, requestPostId: string, createdAt: string): Promise<DonationDTO | null>;
  getDonationRequestsByDate(seekerId: string, datePrefix: string): Promise<DonationDTO[] | null>;
} & Repository<DonationDTO, Record<string, unknown>>
export default BloodDonationRepository
