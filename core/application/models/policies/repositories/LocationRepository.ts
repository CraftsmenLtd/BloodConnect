import type { LocationDTO } from '../../../../../commons/dto/UserDTO'
import type Repository from './Repository'

type LocationRepository<> = {
  queryUserLocations(userId: string): Promise<LocationDTO[]>;
  deleteUserLocations(userId: string): Promise<void>;
} & Repository<LocationDTO, Record<string, unknown>>
export default LocationRepository
