import { DTO } from '../../../../../commons/dto/DTOCommon'
import Repository from './Repository'

export default interface AcceptedDonationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> extends Repository<T, DbFields> {
  queryAcceptedRequests(seekerId: string, requestPostId: string): Promise<T[] | null>;
  getAcceptedRequest(seekerId: string, requestPostId: string, donorId: string): Promise<T | null>;
  deleteAcceptedRequest(seekerId: string, requestPostId: string, donorId: string): Promise<void>;
}
