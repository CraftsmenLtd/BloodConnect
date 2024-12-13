import { DTO } from '../../../../../commons/dto/DTOCommon'
import Repository from './Repository'

export default interface BloodDonationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> extends Repository<T, DbFields> {
  getDonationRequest(seekerId: string, requestPostId: string, createdAt: string): Promise<T | null>;
}
