import { DTO } from '../../../../../commons/dto/DTOCommon'
import Repository from './Repository'

export default interface AcceptedDonationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> extends Repository<T, DbFields> {
  queryAcceptedRequests(seekerId: string, requestPostId: string): Promise<T[] | null>;
}
