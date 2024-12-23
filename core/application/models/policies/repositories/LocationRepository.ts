import { DTO } from '../../../../../commons/dto/DTOCommon'
import Repository from './Repository'

export default interface LocationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> extends Repository<T, DbFields> {
  deleteUserLocations(userId: string): Promise<void>;
}
