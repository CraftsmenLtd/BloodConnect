import type { LocationDTO } from '../../../../../commons/dto/UserDTO'
import type { DTO } from '../../../../../commons/dto/DTOCommon'
import type Repository from './Repository'

type LocationRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> = {
  queryUserLocations(userId: string): Promise<LocationDTO[]>;
  deleteUserLocations(userId: string): Promise<void>;
} & Repository<T, DbFields>
export default LocationRepository
