import type { DTO } from '../../../../../commons/dto/DTOCommon'
import type Repository from './Repository'

type BloodDonationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> = {
  getDonationRequest(seekerId: string, requestPostId: string, createdAt: string): Promise<T | null>;
} & Repository<T, DbFields>
export default BloodDonationRepository
