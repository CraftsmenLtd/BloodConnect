import type { UserDetailsDTO } from 'commons/dto/UserDTO';
import type Repository from './Repository';

type UserRepository = Repository<UserDetailsDTO, Record<string, unknown>>
export default UserRepository
