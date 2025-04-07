import type { DTO } from '../../../../../commons/dto/DTOCommon'
import type Repository from './Repository'

type AcceptedDonationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> = {
  queryAcceptedRequests(seekerId: string, requestPostId: string): Promise<T[] | null>;
  getAcceptedRequest(seekerId: string, requestPostId: string, donorId: string): Promise<T | null>;
  deleteAcceptedRequest(seekerId: string, requestPostId: string, donorId: string): Promise<void>;
} & Repository<T, DbFields>
export default AcceptedDonationRepository
