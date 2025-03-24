import type { LocationDTO } from '../../../../../commons/dto/UserDTO'
import type { DTO } from '../../../../../commons/dto/DTOCommon'
import type Repository from './Repository'

export default interface LocationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> extends Repository<T, DbFields> {
  queryUserLocations(userId: string): Promise<LocationDTO[]>;
  deleteUserLocations(userId: string): Promise<void>;
}
